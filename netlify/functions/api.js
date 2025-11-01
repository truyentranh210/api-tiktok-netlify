const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");

const app = express();
const router = express.Router();

// ======== CẤU HÌNH API ==========
const RAPID_KEY = "c34cb19c93mshb9c6b44976bfac8p1a895ejsnc8507442879c";
const RAPID_HOST = "tiktok-scraper2.p.rapidapi.com";

// ======== /api/home ==========
router.get("/home", (req, res) => {
  res.json({
    status: "✅ API TikTok đang hoạt động!",
    usage: {
      "/api/tiktok?url=@username":
        "→ Lấy thông tin người dùng (avatar, follower, like, video...)",
      "/api/videotik?url=link_video":
        "→ Lấy thông tin video (tiêu đề, hashtag, view, like, link tải...)",
    },
    example: {
      user: "https://api-tt.netlify.app/api/tiktok?url=@tiktok",
      video:
        "https://api-tt.netlify.app/api/videotik?url=https://www.tiktok.com/@dogfood225/video/7566687492762619154",
    },
  });
});

// ======== /api/tiktok ==========
router.get("/tiktok", async (req, res) => {
  try {
    const userParam = req.query.url;
    if (!userParam)
      return res.json({ error: "❌ Thiếu @username hoặc link TikTok!" });

    // Xử lý input: @username hoặc link
    const username = userParam.replace("@", "").trim().split("/").pop();

    const apiUrl = `https://${RAPID_HOST}/user/info?unique_id=${username}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "x-rapidapi-key": RAPID_KEY,
        "x-rapidapi-host": RAPID_HOST,
      },
    });

    const user = response.data?.data;
    if (!user)
      return res.json({
        error: "❌ Không thể lấy thông tin người dùng!",
        debug: response.data,
      });

    res.json({
      status: "success",
      data: {
        username: "@" + user.unique_id,
        nickname: user.nickname,
        avatar: user.avatar_larger_url,
        bio: user.signature,
        followers: user.follower_count,
        following: user.following_count,
        likes: user.total_heart_count,
        videos: user.video_count,
        isVerified: user.is_verified,
      },
    });
  } catch (err) {
    console.error("USER_ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: "❌ Không thể lấy thông tin người dùng!",
      debug: err.message,
    });
  }
});

// ======== /api/videotik ==========
router.get("/videotik", async (req, res) => {
  try {
    const link = req.query.url;
    if (!link) return res.json({ error: "❌ Thiếu URL video TikTok!" });

    // Lấy video_id
    const match = link.match(/video\/(\d+)/);
    if (!match) return res.json({ error: "❌ Không thể tách video_id!" });
    const video_id = match[1];

    const apiUrl = `https://${RAPID_HOST}/video/info_v2?video_url=${encodeURIComponent(
      link
    )}&video_id=${video_id}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "x-rapidapi-key": RAPID_KEY,
        "x-rapidapi-host": RAPID_HOST,
      },
    });

    const video =
      response.data?.data ||
      response.data?.itemInfo?.itemStruct ||
      null;

    if (!video)
      return res.json({
        error: "❌ Không tìm thấy video!",
        debug: response.data,
      });

    const info = video.author
      ? video
      : response.data.itemInfo?.itemStruct || {};
    const author = info.author || {};

    res.json({
      status: "success",
      data: {
        title: info.desc || info.title || "",
        author: author.uniqueId || author.nickname || "Unknown",
        author_nickname: author.nickname || "",
        hashtags: info.textExtra?.map((h) => h.hashtagName) || [],
        views: info.stats?.playCount || info.play_count || 0,
        likes: info.stats?.diggCount || info.digg_count || 0,
        comments: info.stats?.commentCount || info.comment_count || 0,
        shares: info.stats?.shareCount || info.share_count || 0,
        cover_image:
          info.video?.cover ||
          info.video?.originCover ||
          info.cover ||
          author.avatarLarger ||
          "",
        download_url:
          info.video?.downloadAddr ||
          info.play ||
          "",
      },
    });
  } catch (err) {
    console.error("VIDEO_ERROR:", err.response?.data || err.message);
    res
      .status(500)
      .json({ error: "❌ Không thể lấy thông tin video!", debug: err.message });
  }
});

// ==========================================================
app.use("/api", router);
module.exports.handler = serverless(app);

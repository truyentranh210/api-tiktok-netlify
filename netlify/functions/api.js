const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");

const app = express();
const router = express.Router();

const RAPID_KEY = "c34cb19c93mshb9c6b44976bfac8p1a895ejsnc8507442879c";
const RAPID_HOST = "tiktok-scraper2.p.rapidapi.com";

// =================== /api/home ===================
router.get("/home", (req, res) => {
  res.json({
    status: "✅ API TikTok hoạt động!",
    usage: {
      "/api/tiktok?url=@username":
        "→ Lấy thông tin người dùng (avatar, follower, like, video...)",
      "/api/videotik?url=link_video":
        "→ Lấy thông tin video (tiêu đề, hashtag, view, like, link tải...)",
    },
  });
});

// =================== /api/tiktok ===================
router.get("/tiktok", async (req, res) => {
  try {
    let userParam = req.query.url;
    if (!userParam) return res.json({ error: "❌ Thiếu @username!" });

    userParam = userParam.trim().replace("@", "").replace(/\//g, "");

    const tryEndpoints = [
      `https://${RAPID_HOST}/user/info_v2?unique_id=${encodeURIComponent(
        userParam
      )}`,
      `https://${RAPID_HOST}/user/info?unique_id=${encodeURIComponent(
        userParam
      )}`,
    ];

    let user = null;
    for (const apiUrl of tryEndpoints) {
      const response = await axios.get(apiUrl, {
        headers: {
          "x-rapidapi-key": RAPID_KEY,
          "x-rapidapi-host": RAPID_HOST,
        },
      });
      if (response.data?.data) {
        user = response.data.data;
        break;
      }
    }

    if (!user)
      return res.json({ error: "❌ Không thể lấy thông tin người dùng!" });

    res.json({
      status: "success",
      data: {
        username: "@" + user.unique_id,
        nickname: user.nickname,
        avatar: user.avatar_larger_url,
        followers: user.follower_count,
        likes: user.total_heart_count,
        videos: user.video_count,
        isVerified: user.is_verified,
      },
    });
  } catch (err) {
    console.error("USER_ERROR:", err.response?.data || err.message);
    res
      .status(500)
      .json({ error: "❌ Không thể lấy thông tin người dùng!", debug: err.message });
  }
});

// =================== /api/videotik ===================
router.get("/videotik", async (req, res) => {
  try {
    const link = req.query.url;
    if (!link) return res.json({ error: "❌ Thiếu URL video TikTok!" });

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

    // Một số video trả về ở itemInfo.itemStruct thay vì data.data
    const video =
      response.data?.data ||
      response.data?.itemInfo?.itemStruct ||
      null;

    if (!video) {
      return res.json({
        error: "❌ Không tìm thấy video!",
        debug: response.data,
      });
    }

    // Dạng itemStruct (trường hợp bạn gặp)
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

app.use("/api", router);
module.exports.handler = serverless(app);

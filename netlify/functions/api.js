const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");

const app = express();
const router = express.Router();

// RapidAPI key cho phần video
const RAPID_KEY = "c34cb19c93mshb9c6b44976bfac8p1a895ejsnc8507442879c";
const RAPID_HOST = "tiktok-scraper2.p.rapidapi.com";

// =================== /api/home ===================
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

// =================== /api/tiktok (SCRAPER VERSION) ===================
router.get("/tiktok", async (req, res) => {
  try {
    let userParam = req.query.url;
    if (!userParam)
      return res.json({ error: "❌ Thiếu @username hoặc link TikTok!" });

    // Nếu người dùng chỉ nhập username thì tạo link TikTok hợp lệ
    if (!userParam.includes("tiktok.com"))
      userParam = `https://www.tiktok.com/@${userParam.replace("@", "").trim()}`;

    // Gửi request trực tiếp đến TikTok
    const response = await axios.get(userParam, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    // Tìm JSON trong <script id="SIGI_STATE">
    const match = response.data.match(
      /<script id="SIGI_STATE"[^>]*>(.*?)<\/script>/
    );
    if (!match) return res.json({ error: "❌ Không thể phân tích dữ liệu!" });

    const raw = JSON.parse(match[1]);
    const userObj =
      Object.values(raw.UserModule?.users || {})[0] ||
      Object.values(raw.UserModule?.suggestedUsers || {})[0];

    if (!userObj)
      return res.json({ error: "❌ Không tìm thấy người dùng TikTok!" });

    res.json({
      status: "success",
      data: {
        username: userObj.uniqueId,
        nickname: userObj.nickname,
        avatar: userObj.avatarLarger,
        bio: userObj.signature,
        followers: userObj.stats?.followerCount,
        following: userObj.stats?.followingCount,
        likes: userObj.stats?.heartCount,
        videos: userObj.stats?.videoCount,
        isVerified: userObj.verified,
      },
    });
  } catch (err) {
    console.error("USER_ERROR:", err.message);
    res.status(500).json({
      error: "❌ Không thể lấy thông tin người dùng!",
      debug: err.message,
    });
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

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
    status: "✅ API TikTok đang hoạt động!",
    usage: {
      "/api/tiktok?url=@username":
        "Lấy thông tin người dùng TikTok (avatar, follower, like, video...)",
      "/api/videotik?url=link_video":
        "Lấy thông tin video TikTok (tiêu đề, hashtag, view, like, link tải...)",
    },
    example: {
      user: "https://api-tt.netlify.app/api/tiktok?url=@tiktok",
      video:
        "https://api-tt.netlify.app/api/videotik?url=https://www.tiktok.com/@tiktok/video/6974862859000073478",
    },
  });
});

// =================== /api/tiktok ===================
router.get("/tiktok", async (req, res) => {
  try {
    let userParam = req.query.url;
    if (!userParam)
      return res.json({ error: "❌ Thiếu @username hoặc link TikTok!" });

    // Chuẩn hóa username
    userParam = userParam.trim().replace("@", "").replace(/\//g, "");
    const apiUrl = `https://${RAPID_HOST}/user/info_v2?unique_id=${encodeURIComponent(
      userParam
    )}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "x-rapidapi-key": RAPID_KEY,
        "x-rapidapi-host": RAPID_HOST,
      },
    });

    const user = response.data?.data;
    if (!user)
      return res.json({
        error: "❌ Không tìm thấy người dùng!",
        debug: response.data,
      });

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
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "❌ Không thể lấy thông tin người dùng!" });
  }
});

// =================== /api/videotik ===================
router.get("/videotik", async (req, res) => {
  try {
    const link = req.query.url;
    if (!link) return res.json({ error: "❌ Thiếu URL video TikTok!" });

    // Tách video_id từ link
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

    const video = response.data?.data;
    if (!video)
      return res.json({
        error: "❌ Không tìm thấy video!",
        debug: response.data,
      });

    res.json({
      status: "success",
      data: {
        title: video.title || "",
        hashtags: video.hashtags || [],
        views: video.play_count,
        likes: video.digg_count,
        comments: video.comment_count,
        shares: video.share_count,
        author: video.author?.unique_id || null,
        download_url: video.play || null,
        cover_image: video.cover || null,
      },
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "❌ Không thể lấy thông tin video!" });
  }
});

app.use("/api", router);
module.exports.handler = serverless(app);

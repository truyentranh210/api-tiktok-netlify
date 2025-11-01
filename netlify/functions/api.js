const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");

const app = express();
const router = express.Router();

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
        "https://api-tt.netlify.app/api/videotik?url=https://www.tiktok.com/@tiktok/video/7419670199934698758",
    },
  });
});

// =================== /api/tiktok ===================
router.get("/tiktok", async (req, res) => {
  try {
    const userParam = req.query.url;
    if (!userParam)
      return res.json({ error: "❌ Thiếu @username hoặc link TikTok!" });

    const username = userParam.replace("@", "").trim();
    const apiUrl = `https://tiktok-scraper2.p.rapidapi.com/user/info?unique_id=${username}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "x-rapidapi-key": "SIGN-UP-FOR-A-FREE-KEY-AT-rapidapi.com",
        "x-rapidapi-host": "tiktok-scraper2.p.rapidapi.com",
      },
    });

    const user = response.data.data;
    if (!user) return res.json({ error: "Không tìm thấy người dùng!" });

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
    console.error(err.message);
    res.status(500).json({ error: "❌ Không thể lấy thông tin người dùng!" });
  }
});

// =================== /api/videotik ===================
router.get("/videotik", async (req, res) => {
  try {
    const link = req.query.url;
    if (!link) return res.json({ error: "❌ Thiếu URL video TikTok!" });

    const apiUrl = `https://tiktok-scraper2.p.rapidapi.com/video/info?video_url=${encodeURIComponent(
      link
    )}`;
    const response = await axios.get(apiUrl, {
      headers: {
        "x-rapidapi-key": "SIGN-UP-FOR-A-FREE-KEY-AT-rapidapi.com",
        "x-rapidapi-host": "tiktok-scraper2.p.rapidapi.com",
      },
    });

    const video = response.data.data;
    if (!video) return res.json({ error: "Không tìm thấy video!" });

    res.json({
      status: "success",
      data: {
        title: video.title,
        hashtags: video.hashtags || [],
        views: video.play_count,
        likes: video.digg_count,
        comments: video.comment_count,
        shares: video.share_count,
        download_url: video.play,
        cover_image: video.cover,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "❌ Không thể lấy thông tin video!" });
  }
});

// Mount router vào /api
app.use("/api", router);

module.exports.handler = serverless(app);

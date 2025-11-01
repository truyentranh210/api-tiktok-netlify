// netlify/functions/api.js
import express from "express";
import serverless from "serverless-http";
import axios from "axios";

const app = express();

// =================== TRANG HOME ===================
app.get("/home", (req, res) => {
  res.json({
    status: "✅ API TikTok đang hoạt động!",
    usage: {
      "/tiktok?=@username": "Lấy thông tin người dùng (avatar, followers, video...)",
      "/videotik?=video_url": "Lấy thông tin video (hashtag, tiêu đề, lượt xem...)",
    },
    example: {
      user: "https://aaa.netlify.app/api/tiktok?=@tiktokuser",
      video: "https://aaa.netlify.app/api/videotik?=https://www.tiktok.com/@user/video/12345",
    },
  });
});

// =================== THÔNG TIN NGƯỜI DÙNG ===================
app.get("/tiktok", async (req, res) => {
  try {
    const query = req.query[""];
    if (!query) return res.json({ error: "❌ Thiếu username hoặc URL TikTok" });

    // Giả lập API TikTok (demo)
    const fakeData = {
      username: "@demo_user",
      nickname: "Demo User",
      avatar: "https://p16-sign-va.tiktokcdn.com/demo.jpg",
      followers: 12345,
      likes: 67890,
      videos: 42,
      isBusiness: false,
      isArtist: true,
    };

    res.json({ status: "success", data: fakeData });
  } catch (err) {
    res.status(500).json({ error: "❌ Lỗi khi lấy dữ liệu người dùng" });
  }
});

// =================== THÔNG TIN VIDEO ===================
app.get("/videotik", async (req, res) => {
  try {
    const query = req.query[""];
    if (!query) return res.json({ error: "❌ Thiếu URL video TikTok" });

    // Giả lập dữ liệu video
    const fakeVideo = {
      title: "Dance Challenge 💃",
      hashtags: ["#dance", "#funny", "#tiktok"],
      views: 1050000,
      likes: 34000,
      download_url: "https://v16m.tiktokcdn.com/demo_video.mp4",
      cover_image: "https://p16-sign-va.tiktokcdn.com/demo_cover.jpg",
    };

    res.json({ status: "success", data: fakeVideo });
  } catch (err) {
    res.status(500).json({ error: "❌ Lỗi khi lấy dữ liệu video" });
  }
});

// Export Netlify handler
export const handler = serverless(app);

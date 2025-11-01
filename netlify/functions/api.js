const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");

const app = express();
const router = express.Router();

// ======================= /api/home =======================
router.get("/home", (req, res) => {
  res.json({
    status: "✅ API TikTok đang hoạt động!",
    usage: {
      "/api/tiktok?url=@username":
        "→ Lấy thông tin người dùng TikTok (dùng adidaphat.site API)",
      "/api/videotik?url=link_video":
        "→ Lấy thông tin video TikTok (dùng RapidAPI tiktok-scraper2)",
    },
  });
});

// ======================= /api/tiktok =======================
router.get("/tiktok", async (req, res) => {
  try {
    const userParam = req.query.url;
    if (!userParam)
      return res.json({ error: "❌ Thiếu @username hoặc link TikTok!" });

    // Xử lý input để lấy username
    const username = userParam.replace("@", "").trim().split("/").pop();

    // Gọi API trung gian adidaphat.site
    const apiUrl = `https://adidaphat.site/tiktok?type=userinfo&unique_id=${username}`;
    const response = await axios.get(apiUrl);

    const data = response.data;
    if (!data || data.error)
      return res.json({
        error: "❌ Không thể lấy thông tin người dùng!",
        debug: data,
      });

    const user = Array.isArray(data) ? data[0] : data;

    res.json({
      status: "success",
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        signature: user.signature,
        followers: user.stats?.followers,
        following: user.stats?.following,
        likes: user.stats?.likes,
        videos: user.stats?.videos,
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

// ======================= /api/videotik =======================
router.get("/videotik", async (req, res) => {
  try {
    const link = req.query.url;
    if (!link) return res.json({ error: "❌ Thiếu URL video TikTok!" });

    const match = link.match(/video\/(\d+)/);
    if (!match) return res.json({ error: "❌ Không thể tách video_id!" });
    const video_id = match[1];

    const apiUrl = `https://tiktok-scraper2.p.rapidapi.com/video/info_v2?video_url=${encodeURIComponent(
      link
    )}&video_id=${video_id}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "x-rapidapi-key": "c34cb19c93mshb9c6b44976bfac8p1a895ejsnc8507442879c",
        "x-rapidapi-host": "tiktok-scraper2.p.rapidapi.com",
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
    console.error("VIDEO_ERROR:", err.message);
    res.status(500).json({
      error: "❌ Không thể lấy thông tin video!",
      debug: err.message,
    });
  }
});

// ==========================================================
app.use("/api", router);
module.exports.handler = serverless(app);

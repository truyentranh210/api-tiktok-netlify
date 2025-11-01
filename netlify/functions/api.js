// netlify/functions/api.js
import express from "express";
import serverless from "serverless-http";
import axios from "axios";

const app = express();

// =================== /home ===================
app.get("/home", (req, res) => {
  res.json({
    status: "✅ API TikTok công khai đang hoạt động!",
    usage: {
      "/tiktok?=@username":
        "Lấy thông tin người dùng TikTok (avatar, follower, like, video...)",
      "/videotik?=link_video":
        "Lấy thông tin video TikTok (tiêu đề, hashtag, view, like, link tải...)",
    },
    example: {
      user: "https://api-tt.netlify.app/api/tiktok?=@tiktok",
      video:
        "https://api-tt.netlify.app/api/videotik?=https://www.tiktok.com/@tiktok/video/74568909856",
    },
  });
});

// =================== /tiktok ===================
app.get("/tiktok", async (req, res) => {
  try {
    const userParam = req.query[""];
    if (!userParam)
      return res.json({ error: "❌ Thiếu @username hoặc link TikTok!" });

    // Chuẩn hóa username
    const username = userParam.replace("@", "").split("/").pop();
    const url = `https://www.tiktok.com/@${username}`;

    // Gọi HTML TikTok
    const html = (await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } })).data;

    // Lấy JSON metadata trong HTML
    const jsonMatch = html.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);
    if (!jsonMatch) throw new Error("Không tìm thấy dữ liệu người dùng");

    const data = JSON.parse(jsonMatch[1]);
    const userData = data?.UserModule?.users?.[username];
    const stats = data?.UserModule?.stats?.[username];

    if (!userData) return res.json({ error: "Không tìm thấy người dùng!" });

    res.json({
      status: "success",
      data: {
        username: `@${userData.uniqueId}`,
        nickname: userData.nickname,
        avatar: userData.avatarLarger,
        followers: stats?.followerCount,
        likes: stats?.heartCount,
        videos: stats?.videoCount,
        isVerified: userData.verified,
        isBusiness: userData.isBusinessAccount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Không thể lấy thông tin người dùng!" });
  }
});

// =================== /videotik ===================
app.get("/videotik", async (req, res) => {
  try {
    const link = req.query[""];
    if (!link) return res.json({ error: "❌ Thiếu URL video TikTok!" });

    const html = (await axios.get(link, { headers: { "User-Agent": "Mozilla/5.0" } })).data;
    const jsonMatch = html.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);

    if (!jsonMatch) throw new Error("Không tìm thấy dữ liệu video");
    const data = JSON.parse(jsonMatch[1]);
    const item = Object.values(data.ItemModule)[0];

    res.json({
      status: "success",
      data: {
        title: item.desc,
        hashtags: item.textExtra.map((t) => "#" + t.hashtagName).filter(Boolean),
        views: item.stats.playCount,
        likes: item.stats.diggCount,
        comments: item.stats.commentCount,
        shares: item.stats.shareCount,
        download_url: item.video.downloadAddr,
        cover_image: item.video.cover,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Không thể lấy thông tin video!" });
  }
});

// Export Netlify function
export const handler = serverless(app);

const ytdl = require("ytdl-core");

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { url } = req.body;

      if (!ytdl.validateURL(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL!" });
      }

      const info = await ytdl.getInfo(url);
      const formats = info.formats
        .filter((format) => format.hasVideo || format.hasAudio)
        .map((format) => ({
          quality: format.qualityLabel || "Audio",
          type: format.hasVideo ? "Video" : "Audio",
          url: format.url,
        }));

      res.status(200).json({ formats });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch video info." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed." });
  }
}

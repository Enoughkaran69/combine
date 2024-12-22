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

      // Send formats back to the frontend
      if (formats.length === 0) {
        return res.status(404).json({ error: "No downloadable formats found!" });
      }

      res.status(200).json({ formats });
    } catch (error) {
      console.error("Error fetching video info:", error.message);
      res.status(500).json({ error: `Failed to fetch video info. ${error.message}` });
    }
  } else {
    res.status(405).json({ error: "Method not allowed." });
  }
}

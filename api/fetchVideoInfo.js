const ytdl = require("ytdl-core");

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { url } = req.body;

      // Validate URL
      if (!ytdl.validateURL(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL!" });
      }

      // Fetch video information
      const info = await ytdl.getInfo(url);

      // Extract formats
      const formats = info.formats
        .filter((format) => format.url)
        .map((format) => ({
          quality: format.qualityLabel || "Audio Only",
          type: format.hasVideo ? "Video" : "Audio",
          url: format.url,
        }));

      if (formats.length === 0) {
        return res.status(404).json({ error: "No downloadable formats found!" });
      }

      res.status(200).json({ formats });
    } catch (error) {
      console.error("Error fetching video info:", error.message);

      // Handle specific errors like 410
      if (error.message.includes("410")) {
        return res.status(410).json({ error: "YouTube video not accessible (Error 410)." });
      }

      res.status(500).json({ error: `Failed to fetch video info. ${error.message}` });
    }
  } else {
    res.status(405).json({ error: "Method not allowed." });
  }
}

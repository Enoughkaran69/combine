import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Set the FFmpeg binary path
ffmpeg.setFfmpegPath(ffmpegPath);

export default async (req, res) => {
  // Extract video and audio URLs from the query parameters
  const { videoUrl, audioUrl } = req.query;

  if (!videoUrl || !audioUrl) {
    return res.status(400).json({ error: 'Both videoUrl and audioUrl are required' });
  }

  // Temp path to store the output video file
  const outputFile = path.join('/tmp', 'output.mp4'); // Vercel provides /tmp for temporary storage

  try {
    // Use FFmpeg to combine the audio and video
    ffmpeg()
      .input(videoUrl)
      .input(audioUrl)
      .audioCodec('aac')      // Set audio codec to AAC
      .videoCodec('copy')     // Copy the video codec (no re-encoding)
      .output(outputFile)
      .on('end', () => {
        // Once processing is done, send the file back as a response
        res.status(200).sendFile(outputFile);
      })
      .on('error', (err) => {
        res.status(500).json({ error: err.message });
      })
      .run();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing the files' });
  }
};

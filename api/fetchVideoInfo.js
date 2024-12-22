from flask import Flask, request, jsonify
import yt_dlp

app = Flask(__name__)

def get_all_formats(video_url):
    with yt_dlp.YoutubeDL() as ydl:
        info_dict = ydl.extract_info(video_url, download=False)
        formats = info_dict['formats']
        return formats

def bytes_to_mb(byte_size):
    """Convert bytes to megabytes."""
    if byte_size == 'N/A':
        return 'N/A'
    return round(byte_size / (1024 * 1024), 2)  # Convert bytes to MB and round to 2 decimal places

@app.route('/get_video_formats', methods=['POST'])
def get_video_formats():
    video_url = request.json.get('video_url')
    if not video_url:
        return jsonify({"error": "No video URL provided"}), 400

    all_formats = get_all_formats(video_url)
    
    if not all_formats:
        return jsonify({"error": "No formats available."}), 404
    
    video_formats = {}
    audio_formats = []
    combined_formats = []

    # Process each format and store it accordingly
    for format_info in all_formats:
        if format_info['ext'] == 'mhtml':
            continue

        resolution = format_info.get('height', 'None')  # Get resolution or 'None' if not available
        
        if resolution != 'None':
            # Check if this resolution already exists, and keep the highest file size format
            current_filesize = format_info.get('filesize', 0)
            if resolution not in video_formats or video_formats[resolution].get('filesize', 0) < current_filesize:
                video_formats[resolution] = format_info
        else:
            # For audio-only formats, add them to the audio list
            if format_info['ext'] == 'm4a':
                format_info['type'] = 'Audio Codec'
            audio_formats.append(format_info)

        # Find combined formats (both audio and video) based on presence of audio and video codecs
        if 'audio_codec' in format_info and 'video_codec' in format_info:
            combined_formats.append(format_info)

    best_combined = None
    if combined_formats:
        best_combined = max(combined_formats, key=lambda f: f.get('filesize', 0))
    
    best_video = max(video_formats.values(), key=lambda f: f.get('filesize', 0))
    best_video_size = best_video.get('filesize', 0)
    best_video_resolution = best_video.get('height', 'Unknown')

    response = {
        "video_formats": [
            {
                "format_id": format_info['format_id'],
                "extension": format_info['ext'].upper(),
                "resolution": resolution,
                "file_size_mb": bytes_to_mb(format_info.get('filesize', 0))
            }
            for resolution, format_info in video_formats.items()
        ],
        "audio_formats": [
            {
                "format_id": format_info['format_id'],
                "extension": format_info['ext'].upper(),
                "type": format_info.get('type', 'Audio'),
                "bitrate": format_info.get('tbr', 'N/A'),
                "file_size_mb": bytes_to_mb(format_info.get('filesize', 0))
            }
            for format_info in audio_formats
        ],
        "best_video": {
            "resolution": best_video_resolution,
            "file_size_mb": bytes_to_mb(best_video_size)
        },
        "best_combined": {
            "resolution": best_combined.get('height', 'N/A') if best_combined else 'N/A',
            "file_size_mb": bytes_to_mb(best_combined.get('filesize', 0)) if best_combined else 'N/A'
        }
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)

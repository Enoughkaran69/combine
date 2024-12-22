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
    return round(byte_size / (1024 * 1024), 2)

@app.route('/get-formats', methods=['GET'])
def get_formats():
    video_url = request.args.get('url')
    
    if not video_url:
        return jsonify({"error": "Please provide a video URL using the 'url' query parameter."}), 400
    
    all_formats = get_all_formats(video_url)
    
    if not all_formats:
        return jsonify({"error": "No formats available for this video."}), 404
    
    video_formats = {}
    audio_formats = []
    combined_formats = []

    for format_info in all_formats:
        if format_info['ext'] == 'mhtml':
            continue
        
        resolution = format_info.get('height', 'None')
        
        if resolution != 'None':
            current_filesize = format_info.get('filesize', 0)
            if resolution not in video_formats or video_formats[resolution].get('filesize', 0) < current_filesize:
                video_formats[resolution] = format_info
        else:
            if format_info['ext'] == 'm4a':
                format_info['type'] = 'Audio Codec'
            audio_formats.append(format_info)
        
        if 'audio_codec' in format_info and 'video_codec' in format_info:
            combined_formats.append(format_info)

    best_combined = None
    if combined_formats:
        best_combined = max(combined_formats, key=lambda f: f.get('filesize', 0))
    
    best_video = max(video_formats.values(), key=lambda f: f.get('filesize', 0))
    best_video_size = best_video.get('filesize', 0)
    best_video_resolution = best_video.get('height', 'Unknown')

    result = {
        "video_formats": [{
            "format_id": f['format_id'],
            "ext": f['ext'].upper(),
            "resolution": res,
            "file_size": bytes_to_mb(f.get('filesize', 'N/A'))
        } for res, f in video_formats.items()],
        "audio_formats": [{
            "format_id": f['format_id'],
            "ext": f['ext'].upper(),
            "type": f.get('type', 'Audio Only'),
            "bitrate": f.get('tbr', 'N/A'),
            "file_size": bytes_to_mb(f.get('filesize', 'N/A'))
        } for f in audio_formats],
        "best_video": {
            "resolution": best_video_resolution,
            "file_size": bytes_to_mb(best_video_size)
        },
        "best_combined": {
            "resolution": best_combined.get('height', 'N/A') if best_combined else 'N/A',
            "file_size": bytes_to_mb(best_combined.get('filesize', 0)) if best_combined else 'N/A'
        }
    }

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)

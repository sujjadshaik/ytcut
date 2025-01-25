from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import yt_dlp
from moviepy.video.io.VideoFileClip import VideoFileClip
import os
import tempfile
import logging
import shutil

app = Flask(__name__)
CORS(app, origins=['http://localhost:8080', 'https://your-production-domain.com'])

logging.basicConfig(level=logging.DEBUG)

@app.route('/download', methods=['POST'])
def download_video():
    temp_dir = None
    try:
        data = request.json
        app.logger.info(f"Received data: {data}")
        if not data:
            return jsonify({"error": "No data received"}), 400
            
        video_url = data.get('url')
        start_time = float(data.get('start_time', 0))
        end_time = float(data.get('end_time', 0))
        filename = data.get('filename', 'cut_video.mp4')

        if not video_url:
            return jsonify({"error": "No video URL provided"}), 400

        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        app.logger.info(f"Created temp directory: {temp_dir}")
        
        # Configure yt-dlp options for 1080p
        ydl_opts = {
            'format': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best',
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'merge_output_format': 'mp4',
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4'
            }],
            'verbose': True
        }
        
        # Download video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            video_path = ydl.prepare_filename(info)
            if not video_path.endswith('.mp4'):
                video_path = video_path.rsplit('.', 1)[0] + '.mp4'
            app.logger.info(f"Downloaded video to: {video_path}")

        # Cut video
        video_clip = VideoFileClip(video_path)
        final_clip = video_clip.subclip(start_time, end_time)
        
        output_path = os.path.join(temp_dir, filename)
        final_clip.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac",
            bitrate="8000k",
            preset='faster'
        )
        app.logger.info(f"Created cut video at: {output_path}")

        # Clean up the original clip
        video_clip.close()
        final_clip.close()
        
        if os.path.exists(video_path):
            os.remove(video_path)

        # Send file with proper headers
        response = send_file(
            output_path,
            mimetype='video/mp4',
            as_attachment=True,
            download_name=filename,
            conditional=True
        )
        
        response.headers['Content-Length'] = os.path.getsize(output_path)
        response.headers['Access-Control-Expose-Headers'] = 'Content-Length'
        
        return response
    
    except Exception as e:
        app.logger.error(f"Error processing video: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                app.logger.info(f"Cleaned up temp directory: {temp_dir}")
            except Exception as e:
                app.logger.error(f"Error cleaning temp directory: {str(e)}")

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import yt_dlp
from moviepy.video.io.VideoFileClip import VideoFileClip
import os
import tempfile
import logging
import shutil

app = Flask(__name__)
CORS(app)

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
        
        # Configure yt-dlp options
        ydl_opts = {
            'format': 'best',
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
        }
        
        # Download video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            video_path = ydl.prepare_filename(info)
            app.logger.info(f"Downloaded video to: {video_path}")

        # Cut video
        video_clip = VideoFileClip(video_path)
        final_clip = video_clip.subclipped(start_time, end_time)
        
        output_path = os.path.join(temp_dir, f"cut_{os.path.basename(video_path)}")
        final_clip.write_videofile(output_path, codec="libx264", audio_codec="aac")
        app.logger.info(f"Created cut video at: {output_path}")

        final_cut = send_file(
            output_path,
            as_attachment=True,
            download_name=filename
        )
        
        # Cleanup original video
        video_clip.close()
        os.remove(video_path)
        
        # Return the cut video file
        return final_cut
    
    except Exception as e:
        app.logger.error(f"Error processing video: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            app.logger.info(f"Cleaned up temp directory: {temp_dir}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
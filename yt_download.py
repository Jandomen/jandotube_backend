import yt_dlp
import sys
import os
import re
import time

if len(sys.argv) < 4:
    print("Usage: yt_download.py <url> <output_dir> <format>")
    sys.exit(1)

url = sys.argv[1]
output_dir = sys.argv[2]
file_format = sys.argv[3]

os.makedirs(output_dir, exist_ok=True)

with yt_dlp.YoutubeDL({}) as ydl:
    info = ydl.extract_info(url, download=False)

title = info.get('title', f"video_{int(time.time())}")
safe_title = re.sub(r'[^a-zA-Z0-9_-]', '_', title)

if file_format == 'mp3':
    outtmpl = os.path.join(output_dir, f"{safe_title}.%(ext)s")
    ydl_opts = {
        'format': 'bestaudio',
        'outtmpl': outtmpl,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': False,
        'postprocessor_args': ['-y'], 
    }
else:
    outtmpl = os.path.join(output_dir, f"{safe_title}.%(ext)s")
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
        'merge_output_format': 'mp4',
        'outtmpl': outtmpl,
        'quiet': False,
    }

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    ext = 'mp3' if file_format == 'mp3' else 'mp4'
    final_file = os.path.join(output_dir, f"{safe_title}.{ext}")
    print(f"✅ Descarga completada: {final_file}")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

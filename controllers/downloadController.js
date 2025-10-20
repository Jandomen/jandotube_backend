const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const COOKIES_PATH = path.resolve(__dirname, './cookies.txt');
const TEMP_DIR = path.join(__dirname, 'tacones');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

exports.getMediaInfo = async (req, res) => {
  const { url } = req.body;

  console.log('🔍 Solicitud de información de media recibida');
  console.log('📥 URL recibida:', url);

  if (!url) {
    console.warn('⚠️ URL no proporcionada');
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    console.log('⏳ Obteniendo información con youtube-dl...');
    const info = await youtubedl(url, { dumpSingleJson: true, cookies: COOKIES_PATH });

    console.log('✅ Información obtenida correctamente');
    console.log('📄 Título:', info.title);
    console.log('🖼 Thumbnail:', info.thumbnail);
    console.log('⏱ Duración (s):', info.duration);
    console.log('👤 Subido por:', info.uploader);

    const { title, thumbnail, duration, uploader } = info;
    res.json({ title, thumbnail, duration, uploader });

  } catch (err) {
    console.error('❌ Error al obtener info:', err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.downloadMedia = async (req, res) => {
  const { url, format } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  const fileExt = format === 'mp3' ? 'mp3' : 'mp4';
  const isYouTube = /youtube\.com|youtu\.be/.test(url);

  console.log(`📥 Request descarga: ${url} | formato: ${fileExt}`);

  try {
    let finalFilePath = '';
    let downloadName = '';

    if (isYouTube) {
      console.log('🎬 YouTube detectado. Usando Python yt_dlp...');

      const tempDirName = path.join(TEMP_DIR, `${Date.now()}`);
      fs.mkdirSync(tempDirName, { recursive: true });

      const py = spawn('python3', [
        path.join(__dirname, '../yt_download.py'),
        url,
        tempDirName,
        fileExt,
      ]);

      let stdoutData = '';

      py.stdout.on('data', (data) => {
        stdoutData += data.toString();
        console.log('🐍 PY:', data.toString().trim());
      });

      py.stderr.on('data', (data) => console.log('🐍 PY ERROR:', data.toString().trim()));

      py.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ Python yt_dlp falló con código', code);
          if (!res.headersSent) res.status(500).json({ message: 'Python yt_dlp failed.' });
          return;
        }

        const match = stdoutData.match(/✅ Descarga completada: (.+)$/m);
        if (!match) {
          console.error('❌ No se encontró el archivo final en stdout');
          if (!res.headersSent) res.status(500).json({ message: 'Download failed.' });
          return;
        }

        finalFilePath = match[1].trim();

        if (!fs.existsSync(finalFilePath)) {
          console.error('❌ Archivo final no encontrado:', finalFilePath);
          if (!res.headersSent) res.status(500).json({ message: 'File not found.' });
          return;
        }

        downloadName = path.basename(finalFilePath);
        const finalExt = path.extname(finalFilePath).toLowerCase();
        const contentType = finalExt === '.mp3' ? 'audio/mpeg' : 'video/mp4';

        console.log('📂 Sirviendo archivo:', downloadName);

        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Content-Type', contentType);

        fs.createReadStream(finalFilePath)
          .pipe(res)
          .on('close', () => {
            fs.unlink(finalFilePath, () => console.log(`🧹 Archivo temporal eliminado: ${downloadName}`));
            fs.rmdir(path.dirname(finalFilePath), () => {});
          });
      });

      return;
    }

    const info = await youtubedl(url, { dumpSingleJson: true, cookies: COOKIES_PATH });

    const timestamp = Date.now();
    const safeTitle = info.title
      ? info.title.replace(/[<>:"/\\|?*\n\r\t]+/g, '').replace(/[^\x00-\x7F]/g, '').trim()
      : `video_${timestamp}`;
    downloadName = `${timestamp}-${safeTitle}.${fileExt}`;
    finalFilePath = path.join(TEMP_DIR, downloadName);

    const opts = {
      output: finalFilePath,
      cookies: COOKIES_PATH,
      format: fileExt === 'mp3' ? 'bestaudio[ext=m4a]/bestaudio/best' : 'bestvideo+bestaudio/best',
      mergeOutputFormat: fileExt === 'mp4' ? 'mp4' : undefined,
      extractAudio: fileExt === 'mp3' ? true : undefined,
      audioFormat: fileExt === 'mp3' ? 'mp3' : undefined,
    };

    console.log('🎬 Descargando a:', finalFilePath);
    await youtubedl(url, opts);
    console.log(`✅ Descarga completada: ${downloadName}`);

    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Type', fileExt === 'mp3' ? 'audio/mpeg' : 'video/mp4');

    fs.createReadStream(finalFilePath)
      .pipe(res)
      .on('close', () => fs.unlink(finalFilePath, () => console.log(`🧹 Archivo temporal eliminado: ${downloadName}`)));

  } catch (err) {
    console.error('⚠️ Error en descarga:', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'Download failed.' });
  }
};

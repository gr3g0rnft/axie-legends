const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const url = 'https://www.youtube.com/watch?v=j2coZLPfc-Q';
const outDir = 'public/sounds';
const outFile = path.join(outDir, 'menu-music.webm');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Fetching video info...');
ytdl.getInfo(url).then(info => {
  console.log('Title:', info.videoDetails.title);
  // Choose audio-only format with highest bitrate
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
  if (!format) {
    throw new Error('No audio-only format found');
  }
  console.log('Selected format:', format.container, format.bitrate ? `${format.bitrate} bps` : 'unknown bitrate');
  const audioStream = ytdl.downloadFromInfo(info, { format: format });
  const ffmpegProcess = spawn(ffmpeg.path, [
    '-i', 'pipe:0',
    '-c:v', 'libvpx-vp9',
    '-b:a', '128k',
    '-f', 'webm',
    outFile
  ]);
  audioStream.pipe(ffmpegProcess.stdin);
  ffmpegProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Conversion successful:', outFile);
    } else {
      console.error('FFmpeg exited with code', code);
    }
  });
  ffmpegProcess.stderr.on('data', data => {
    process.stderr.write(data);
  });
}).catch(err => {
  console.error('Error:', err);
});

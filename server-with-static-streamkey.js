const http = require('http');
const path = require('path');
ffmpegPath = path.resolve(__dirname, 'ffmpeg/ffmpeg.exe');
const ffmpeg = require('fluent-ffmpeg');
const express = require('express');
const { Server } = require('socket.io');
const { spawn } = require('child_process'); // Correctly require spawn

//// Set path to FFmpeg binary
//const ffmpegPath = '../ffmpeg/ffmpeg.exe';
ffmpeg.setFfmpegPath(ffmpegPath);

// Create Express app
const app = express();
const server = http.createServer(app);
// const io = new Server(server);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",  // Allow Angular frontend
    methods: ["GET", "POST"]
  }
});
const port = 3000;

const rtmpUrl = 'rtmps://live-input.bitmovin.com/streams/e6308728-cdf7-4ce1-a8b5-2ce81ca3ee51'; // Replace with your RTMP server URL
const options = [
  '-i', '-',
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-tune', 'zerolatency',
  '-r', '25',
  '-g', '50',
  '-keyint_min', '25',
  '-crf', '25',
  '-pix_fmt', 'yuv420p',
  '-sc_threshold', '0',
  '-profile:v', 'main',
  '-level', '3.1',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-ar', '44100',
  '-f', 'flv',
  rtmpUrl,
];

// Correctly use the spawn method
const ffmpegProcess = spawn(ffmpegPath, options);

ffmpegProcess.stdout.on('data', (data) => {
  console.log(`ffmpeg stdout: ${data}`);
});

ffmpegProcess.stderr.on('data', (data) => {
  console.error(`ffmpeg stderr: ${data}`);
});

ffmpegProcess.on('close', (code) => {
  console.log(`ffmpeg process exited with code ${code}`);
});


io.on('connection', socket => {
  console.log('Socket Connected', socket.id);

  socket.on('binarystream', stream => {
    console.log('Binary Stream Incoming...');
    if(!ffmpeg.stdin.destroyed){
      ffmpegProcess.stdin.write(stream, (err) => {
        if (err) {
          console.error('Error writing stream to FFmpeg:', err);
        }
      });
    }
    else {
      console.error('FFmpeg stdin stream has already been destroyed.');
  }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

require('dotenv').config();
const http = require('http');
const ffmpeg = require('fluent-ffmpeg');
const { Server } = require('socket.io');
const { spawn } = require('child_process'); // Correctly require spawn
const express = require('express');
const cors = require('cors');
// ffmpeg-static configuration
const ffmpegPath = require('ffmpeg-static'); // Import ffmpeg-static


//const ffmpegPath = path.resolve(__dirname, 'ffmpeg/ffmpeg.exe');
// const ffmpegPath = 'https://stgfanmire.blob.core.windows.net/livestreaming/ffmpeg.exe';
ffmpeg.setFfmpegPath('ffmpegPath');


// Create Express app
const app = express();
const server = http.createServer(app);

// CORS middleware for Express routes
app.use(cors({
  origin: '*', // Allow Angular frontend
  methods: ['GET', 'POST'],
  credentials: true // Allow cookies and headers
}));

let port = process.env.PORT || 3000;
let ffmpegProcess = null; // Store ffmpeg process here

// Socket.io server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",  // Allow Angular frontend
    methods: ["GET", "POST"],
    credentials: true // Ensure credentials are allowed for cross-origin requests
  },
  //transports: ['polling'] // Support both WebSocket and polling

});

// Socket.io connection and stream handling
io.on('connection', (socket) => {
  console.log('Socket Connected', socket.id);
  socket.emit('Socket Connected', socket.id);
  
  let ffmpegProcess = null;

  socket.on('streamKey', (streamKey) => {
    console.log(`Received Stream Key: ${streamKey}`);
    
    if (!streamKey || typeof streamKey !== 'string') {
      console.error('Invalid stream key');
      socket.emit('error', { message: 'Invalid stream key' });
      return;
    }
    
    const rtmpUrl = `rtmps://global-live.mux.com:443/app/${streamKey}`;
    const options = [
      '-i', '-',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-f', 'flv',
      rtmpUrl,
    ];

    ffmpegProcess = spawn(ffmpegPath, options);

    ffmpegProcess.stderr.on('data', (data) => {
      const errorMessage = data.toString();
      if (errorMessage.includes('error')) {
        console.error(`FFmpeg error: ${errorMessage}`);
      }
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
      ffmpegProcess = null;
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg process error:', err);
      ffmpegProcess = null;
    });
  });

  socket.on('binarystream', (stream) => {
    if (ffmpegProcess && !ffmpegProcess.killed && !ffmpegProcess.stdin.destroyed) {
      ffmpegProcess.stdin.write(stream, (err) => {
        if (err) {
          console.error('Error writing stream to FFmpeg:', err);
        }
      });
    } else {
      socket.emit('error', { message: 'FFmpeg process is not active or has been terminated.' });
    }
  });

  socket.once('disconnect', () => {
    console.log('Socket Disconnected', socket.id);
    if (ffmpegProcess) {
      try { ffmpegProcess.stdin.end(); } catch {}
      try { ffmpegProcess.kill('SIGINT'); } catch {}
      ffmpegProcess = null;
    }
  });
});


// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const Mux = require('@mux/mux-node');
const http = require('http');
const ffmpeg = require('fluent-ffmpeg');
const { Server } = require('socket.io');
const { spawn } = require('child_process'); // Correctly require spawn
const express = require('express');
const cors = require('cors');
// ffmpeg-static configuration
const ffmpegPath = require('ffmpeg-static'); // Import ffmpeg-static
ffmpeg.setFfmpegPath(ffmpegPath);


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
  }
 // transports: ['polling', 'websocket'] // Support both WebSocket and polling

});

// Socket.io connection and stream handling
io.on('connection', async (socket) => {
  console.log('Socket Connected', socket.id);
  socket.emit('Socket Connected', socket.id);
  // Handle streaming with provided stream key
  socket.on('streamKey', (streamKey) => {
    console.log(`Received Stream Key: ${streamKey}`);
    socket.emit(`Received Stream Key: ${streamKey}`);
    const rtmpUrl = `rtmps://global-live.mux.com:443/app/${streamKey}`;

    // Prepare FFmpeg options with dynamic RTMP URL
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

    // Start the FFmpeg process
    ffmpegProcess = spawn(ffmpegPath, options);

    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`ffmpeg stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error(`ffmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`ffmpeg process exited with code ${code}`);
    });
  });

  // Handle incoming video data (binary stream)
  socket.on('binarystream', (stream) => {
    if (ffmpegProcess && !ffmpegProcess.killed) {
      console.log('Binary Stream Incoming...');
      if (!ffmpegProcess.stdin.killed) {
        ffmpegProcess.stdin.write(stream, (err) => {
          console.log("Starting Comming binary stream");
         
          if (err) {
            console.error('Error writing stream to FFmpeg:', err);
          }
        });
      }

    } else {
      console.error('FFmpeg process is not active or has been terminated.');
      socket.emit('error', { message: 'FFmpeg process is not active or has been terminated.' });
    }
  });
  
  socket.on('cameraToggle', (data) => {
    console.log(`Camera state changed: ${data.isCameraOn ? 'ON' : 'OFF'}`);
    // Optionally handle state change on the server
  });
  socket.on('micToggle', (data) => {
    console.log(`Audio state changed: ${data.isMicrophoneOn ? 'ON' : 'OFF'}`);
    // Optionally handle state change on the server
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('Socket Disconnected', socket.id);
    socket.emit('Socket disconnected', socket.id);
    if (ffmpegProcess) {
      ffmpegProcess.stdin.end();
      ffmpegProcess.kill('SIGINT');
      ffmpegProcess = null;
    }
  });
});

app.get("/", (req,res) =>{
  res.send("<h1>Hello World</h1>")
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

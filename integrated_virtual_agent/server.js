const express = require('express');
const session = require('express-session');
const path = require('path');
const baseDir = path.join(__dirname);
const InteractionRouter = require('./back-end/Interaction');
const GenerateRouter = require('./back-end/GenerateScripts');
const app = express();

// Setup EJS if you are rendering EJS templates (not mandatory for serving static frontend)
app.set('view engine', 'ejs');

// Serve static files from the public directory (for frontend: index.html, index.css, index.js)
app.use(express.static(path.join(__dirname, 'front-end')));

// To handle JSON requests
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_KEY, // Make sure SESSION_KEY is in your .env
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        maxAge: 1000 * 60 * 20, // Session lasts for 20 minutes
    }
}));

// <!-- Routes -->
app.use('/Interaction', InteractionRouter);
app.use('/Generate', GenerateRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(Server running on port ${PORT});
});

// FFmpeg path setting (add this block)
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

// FFmpeg location verification (add this block for testing)
const { exec } = require('child_process');
exec('which ffmpeg', (err, stdout) => {
  if (err) {
    console.error(exec error: ${err});
    return;
  }
  console.log('FFmpeg location:', stdout);
});

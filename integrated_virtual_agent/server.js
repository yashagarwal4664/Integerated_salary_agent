const express = require('express');
const session = require('express-session');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg'); // FFmpeg path setup
const { exec } = require('child_process');

const app = express();

// ✅ Set FFmpeg path to system-installed version (works on Render)
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

// ✅ Optional: Log the ffmpeg path (for verification during deployment)
exec('which ffmpeg', (err, stdout) => {
    if (err) {
        console.error(`Exec error: ${err}`);
        return;
    }
    console.log(`FFmpeg location: ${stdout}`);
});

// Base directory path
const baseDir = path.join(__dirname);

// Routers
const InteractionRouter = require('./back-end/Interaction');
const GenerateRouter = require('./back-end/GenerateScripts');

// Setup EJS if rendering templates (optional)
app.set('view engine', 'ejs');

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'front-end')));

// Handle JSON requests
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_KEY || 'default_secret',  // fallback if SESSION_KEY is missing
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        maxAge: 1000 * 60 * 20, // 20 minutes
    }
}));

// Routes
app.use('/Interaction', InteractionRouter);
app.use('/Generate', GenerateRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

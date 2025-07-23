const express = require("express");
const path = require("path");
const fetch = require("node-fetch"); // Re-add node-fetch import

require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Adjust path to root
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg"); // Import ffmpeg for audio processing
const ffmpegPath = require("ffmpeg-static"); // Path to the static binary
ffmpeg.setFfmpegPath(ffmpegPath); // Set the path explicitly

// If you want to use OpenAI for audio generation only
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = express.Router();
router.use(express.static(path.join(__dirname, "public")));
const jsonDir = path.resolve(__dirname, "./json");
const { v4: uuidv4 } = require("uuid");

// URL of your Python AI Negotiator API
const AI_NEGOTIATOR_API_URL = process.env.AI_NEGOTIATOR_API_URL || "http://localhost:5000/negotiate";

// The main function to handle user input
router.post("/:nodeId", async (req, res, next) => {
    const nodeId = parseInt(req.params.nodeId);
    const additionalData = req.body || {};
    const userMessage = additionalData.userInput; // The user\'s message to send to the AI
    const sessionId = req.session?.id || "default-session"; // Use express-session\'s session ID or fallback

    if (!userMessage) {
        console.error("No user input provided for AI negotiation.");
        return res.status(400).json({ error: "No user input provided" });
    }

    try {
        // Call your Python AI Negotiator API
        const aiResponse = await fetch(AI_NEGOTIATOR_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userInput: userMessage,
                sessionId: sessionId
            }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`AI Negotiator API error: ${aiResponse.status} - ${errorText}`);
            return res.status(aiResponse.status).json({ error: `AI Negotiator API error: ${errorText}` });
        }

        const aiData = await aiResponse.json();
        const dialogue = aiData.reply; // This is the text from your AI agent

        if (!dialogue) {
            console.warn("AI Negotiator returned an empty reply.");
            return res.status(200).json({ dialogue: "I\'m sorry, I don\'t have a response right now.", audio: null });
        }

        const sentences = splitTextIntoSentences(dialogue);
        
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        
        // Process first sentence immediately
        const firstSentence = sentences[0];
        const firstChunk = await processSentence(firstSentence, {
            nodeId: nodeId,
            dialogue: dialogue,
            wholeDialogue: dialogue,
            input: { nextNode: nodeId + 1 }, // Adjust nextNode logic as needed for AI-driven flow
            options: [] // AI agent will determine options or just free text input
        }, true);
        
        res.write(JSON.stringify(firstChunk) + "\n");
        
        // Process remaining sentences concurrently
        const remainingChunksPromises = sentences.slice(1).map((sentence, index) =>
            processSentence(sentence, {
                nodeId: nodeId,
                dialogue: dialogue,
                wholeDialogue: dialogue,
                input: { nextNode: nodeId + 1 },
                options: []
            }, false)
        );
        
        try {
            const remainingChunks = await Promise.all(remainingChunksPromises);
            
            remainingChunks.forEach(chunk => {
                res.write(JSON.stringify(chunk) + "\n");
            });
            
            const responseData = {
                nodeId: nodeId,
                dialogue: dialogue,
                audio: null,
                input: { nextNode: nodeId + 1 }, // Or determine dynamically from AI response
                options: [], // Or determine dynamically from AI response
                type: "END CHUNK",
                wholeDialogue: dialogue
            };
            
            console.log("Sending final response from AI:", responseData);
            res.write(JSON.stringify(responseData) + "\n");
            res.end();
            
        } catch (err) {
            console.error("Error processing remaining chunks from AI response:", err);
            res.status(500).end();
        }
        
    } catch (err) {
        console.error("Error during AI Negotiator API call or processing:", err);
        return res.status(500).json({ error: "Failed to get response from AI Negotiator" });
    }
});

// Helper function to process and send response
async function processAndSendResponse(res, nodeId, dialogue, nextNode, options) {
    try {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        
        // Generate audio for the dialogue
        const sentences = splitTextIntoSentences(dialogue);
        
        // Process first sentence immediately
        const firstSentence = sentences[0];
        const firstChunk = await processSentence(firstSentence, {
            nodeId: nodeId,
            dialogue: dialogue,
            wholeDialogue: dialogue,
            input: { nextNode: nextNode },
            options: options
        }, true);
        
        res.write(JSON.stringify(firstChunk) + "\n");
        
        // Process remaining sentences concurrently
        const remainingChunksPromises = sentences.slice(1).map((sentence, index) =>
            processSentence(sentence, {
                nodeId: nodeId,
                dialogue: dialogue,
                wholeDialogue: dialogue,
                input: { nextNode: nextNode },
                options: options
            }, false)
        );
        
        try {
            const remainingChunks = await Promise.all(remainingChunksPromises);
            
            // Stream remaining chunks as they finish
            remainingChunks.forEach(chunk => {
                res.write(JSON.stringify(chunk) + "\n");
            });
            
            // Send the final response data
            const responseData = {
                nodeId: nodeId,
                dialogue: dialogue,
                audio: null,
                input: { nextNode: nextNode },
                options: options,
                type: "END CHUNK",
                wholeDialogue: dialogue
            };
            
            console.log("Sending final response:", responseData);
            res.write(JSON.stringify(responseData) + "\n");
            res.end();
            
        } catch (err) {
            console.error("Error processing remaining chunks:", err);
            res.status(500).end();
        }
    } catch (err) {
        console.error("Error in processAndSendResponse:", err);
        res.status(500).json({ error: "Failed to process response" });
    }
}

// Helper function to process a single sentence
async function processSentence(sentence, nodeData, isFirstChunk) {
    const chunkType = isFirstChunk ? "NEW AUDIO" : "CHUNK";
    const createdFiles = [];
    const tempDir = "./audio"; // Directory for temporary files
    const gender = "female";

    try {
        // Ensure /tmp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            console.log(`Created directory: ${tempDir}`);
        }
        const voice = gender === "male" ? "echo" : "shimmer";

        // Generate audio
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice,
            input: sentence,
            response_format: "wav",
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const uniqueFilename = `speech_${uuidv4()}.wav`;
        const speechFile = path.join(tempDir, uniqueFilename);
        await fs.promises.writeFile(speechFile, buffer);
        createdFiles.push(speechFile);

        // Speed up audio
        const spedUpFilename = `spedup_${uniqueFilename}`;
        const spedUpFilePath = path.join(tempDir, spedUpFilename);
        await new Promise((resolve, reject) => {
            ffmpeg(speechFile)
                .audioFilters("atempo=1.1")
                .save(spedUpFilePath)
                .on("end", resolve)
                .on("error", reject);
        });
        createdFiles.push(spedUpFilePath);

        // Convert to Base64
        const spedUpBuffer = await fs.promises.readFile(spedUpFilePath);
        const audioBase64 = spedUpBuffer.toString("base64");

        // Transcription
        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: fs.createReadStream(spedUpFilePath),
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["word", "segment"],
        });

        const sentenceAudio = transcriptionResponse?.words
            ? {
                audioBase64,
                words: transcriptionResponse.words.map(x => x.word),
                wtimes: transcriptionResponse.words.map(x => 1000 * x.start - 150),
                wdurations: transcriptionResponse.words.map(x => 1000 * (x.end - x.start)),
            }
            : { audioBase64 };

        return {
            nodeId: nodeData.nodeId,
            dialogue: sentence,
            audio: sentenceAudio,
            input: nodeData.input || null,
            options: nodeData.options || [],
            type: chunkType,
            wholeDialogue: nodeData.wholeDialogue
        };
    } catch (error) {
        console.error("Error processing sentence:", error);
        return { error: `Failed to process sentence: ${sentence}` };
    } finally {
        // Cleanup: Delete all created audio files
        for (const filePath of createdFiles) {
            try {
                await fs.promises.unlink(filePath);
                // console.log(`Deleted file: ${filePath}`);
            } catch (cleanupError) {
                console.error(`Failed to delete file: ${filePath}`, cleanupError);
            }
        }
    }
}

function splitTextIntoSentences(text) {
    // Modern approach using Intl.Segmenter
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
        return Array.from(segmenter.segment(text), segment => segment.segment);
    }

    // Fallback for environments without Intl.Segmenter
    return text.match(/[^.!?]+[.!?]+/g) || [text];
}

module.exports = router;





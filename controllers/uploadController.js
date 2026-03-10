// controllers/uploadController.js
const axios = require('axios');
const FormData = require('form-data');
const { getContainer } = require('../db');

/**
 * Handle image uploads.
 * This endpoint proxies the upload to the Python AI API and stores the result in Cosmos DB.
 */
exports.handleUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }

        const studentId = req.user.uid || req.user.email;

        // Create form data to send to Python API
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        console.log("Calling Python AI API /api/upload...");
        const baseUrl = process.env.PYTHON_API_URL || 'https://studybuddyaiapi-afaxhvgdgmdvawad.southeastasia-01.azurewebsites.net';
        const pythonApiUrl = `${baseUrl}/api/upload`;
        console.log(`[DEBUG] Target Python API URL: ${pythonApiUrl}`);

        const response = await axios.post(pythonApiUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const { extracted_notes, topic, summary, audio_base64, flash_notes, quiz, flowchart } = response.data;

        // Save metadata to Cosmos DB
        const container = getContainer();
        const docId = `doc_${Date.now()}`;
        if (container) {
            const doc = {
                id: docId,
                studentId: studentId,
                type: 'document',
                extracted_notes: extracted_notes,
                topic: topic,
                summary: summary,
                audio_base64: audio_base64,
                flash_notes: flash_notes,
                quiz: quiz,
                flowchart: flowchart,
                filename: req.file.originalname,
                createdAt: new Date().toISOString()
            };
            await container.items.create(doc);
            console.log("Document metadata saved to Cosmos DB.");
        } else {
            console.warn("Cosmos DB container not initialized, skipping DB insert.");
        }

        // Map AI quiz format to frontend expected format (answer -> correctAnswer)
        const formattedQuiz = (quiz || []).map(q => ({
            ...q,
            correctAnswer: q.answer || q.correctAnswer
        }));

        return res.status(200).json({
            success: true,
            message: 'Image processed successfully.',
            data: {
                id: docId,
                extractedText: extracted_notes,
                topic: topic,
                summary: summary,
                audio_base64: audio_base64,
                flash_notes: flash_notes,
                flowchart: flowchart,
                quiz: formattedQuiz,
                filename: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error("Upload error:", error.response?.data || error.message);
        return res.status(500).json({ error: 'Internal server error during upload.' });
    }
};

/**
 * Handle image uploads from within the chat.
 * This endpoint proxies the upload to the Python AI API (/api/ocr) and stores the result as a chat message in Cosmos DB.
 */
exports.handleChatUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }

        const studentId = req.user.uid || req.user.email;

        // Create form data to send to Python API
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        console.log("Calling Python AI API /api/ocr...");
        // Use the new /api/ocr endpoint
        const baseUrl = process.env.PYTHON_API_URL || 'https://studybuddyaiapi-afaxhvgdgmdvawad.southeastasia-01.azurewebsites.net';
        const pythonApiUrl = `${baseUrl}/api/ocr`;
        console.log(`[DEBUG] Target Python API URL: ${pythonApiUrl}`);

        const response = await axios.post(pythonApiUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const { extracted_text } = response.data;

        // Save as a USER CHAT MESSAGE, not as a main document
        const container = getContainer();
        if (container) {
            const doc = {
                id: `chat_${Date.now()}_u`,
                studentId: studentId,
                type: 'chat',
                role: 'user',
                text: `[Image Uploaded] Extracted Text:\n${extracted_text}`,
                createdAt: new Date().toISOString()
            };
            await container.items.create(doc);
            console.log("Chat image text saved to Cosmos DB as a user message.");
        } else {
            console.warn("Cosmos DB container not initialized, skipping DB insert.");
        }

        return res.status(200).json({
            success: true,
            message: 'Chat image processed successfully.',
            data: {
                extractedText: extracted_text,
                filename: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error("Chat Upload error:", error.response?.data || error.message);
        return res.status(500).json({ error: 'Internal server error during chat upload.' });
    }
};

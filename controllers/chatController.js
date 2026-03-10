// controllers/chatController.js
const axios = require('axios');
const { getContainer } = require('../db');

/**
 * Handle chat messages from the user.
 * Forwards the request to the Python AI API.
 */
exports.handleChat = async (req, res) => {
    try {
        const { message, screenshot_text } = req.body;
        const studentId = req.user.uid || req.user.email;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const container = getContainer();
        let topic = "General Study";
        let notes = "";
        let chat_history = [];

        if (container) {
            // Fetch recent history
            const { resources: historyItems } = await container.items.query({
                query: "SELECT * FROM c WHERE c.studentId = @id AND c.type = 'chat' ORDER BY c.createdAt ASC",
                parameters: [{ name: "@id", value: studentId }]
            }).fetchAll();

            chat_history = historyItems.map(item => ({
                role: item.role,
                content: item.text
            }));

            // Fetch latest document
            const { resources: docItems } = await container.items.query({
                query: "SELECT TOP 1 * FROM c WHERE c.studentId = @id AND c.type = 'document' ORDER BY c.createdAt DESC",
                parameters: [{ name: "@id", value: studentId }]
            }).fetchAll();

            if (docItems.length > 0) {
                topic = docItems[0].topic || topic;
                notes = docItems[0].extracted_notes || notes;
            }
        }

        // Add user message to history payload
        chat_history.push({ role: "user", content: message });

        // Call Python AI API
        const baseUrl = process.env.PYTHON_API_URL || 'https://studybuddyaiapi-afaxhvgdgmdvawad.southeastasia-01.azurewebsites.net';
        const pythonApiUrl = `${baseUrl}/api/chat`;
        console.log(`[DEBUG] Target Python API URL: ${pythonApiUrl}`);
        console.log("Calling Python AI API /api/chat...");

        const response = await axios.post(pythonApiUrl, {
            question: message,
            notes: notes,
            topic: topic,
            chat_history: chat_history.slice(0, -1), // Everything except the current message (some APIs want only past history, some want all. Based on spec: chat_history contains past messages, question contains current)
            screenshot_text: screenshot_text
        });

        const { answer } = response.data;

        // Save to DB
        if (container) {
            const userMsgDoc = {
                id: `chat_${Date.now()}_u`,
                studentId: studentId,
                type: 'chat',
                role: 'user',
                text: message,
                createdAt: new Date().toISOString()
            };
            const aiMsgDoc = {
                id: `chat_${Date.now()}_a`,
                studentId: studentId,
                type: 'chat',
                role: 'assistant',
                text: answer,
                createdAt: new Date(Date.now() + 10).toISOString()
            };
            await container.items.create(userMsgDoc);
            await container.items.create(aiMsgDoc);
        }

        return res.status(200).json({
            success: true,
            reply: answer
        });

    } catch (error) {
        console.error("Chat error:", error.response?.data || error.message);
        return res.status(500).json({ error: 'Internal server error during chat.' });
    }
};


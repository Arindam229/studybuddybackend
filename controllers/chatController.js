// controllers/chatController.js

/**
 * Handle chat messages from the user.
 * This is a mocked endpoint that pretends to interact with an AI model.
 */
exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        // User is attached by the verifyToken middleware
        const studentId = req.user.uid || req.user.email;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock AI response
        const mockReply = `Hello ${studentId}, you asked: "${message}". I am a mocked AI response meant to help you study!`;

        // We aren't saving to DB here yet (mocking stage), but this is where we'd insert into CosmosDB.

        return res.status(200).json({
            success: true,
            reply: mockReply,
            audioUrl: null // Placeholder for TTS later
        });

    } catch (error) {
        console.error("Chat error:", error);
        return res.status(500).json({ error: 'Internal server error during chat.' });
    }
};

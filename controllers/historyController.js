// controllers/historyController.js

/**
 * Retrieve chat history for a given user.
 * This is a mocked endpoint returning static history data.
 */
exports.getHistory = async (req, res) => {
    try {
        // User is attached by the verifyToken middleware
        const studentId = req.user.uid || req.user.email;

        // Mock history data
        const mockHistory = [
            {
                id: "1",
                studentId: studentId,
                role: "user",
                text: "Can you explain photosynthesis?",
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: "2",
                studentId: studentId,
                role: "ai",
                text: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.",
                timestamp: new Date(Date.now() - 3590000).toISOString()
            }
        ];

        return res.status(200).json({
            success: true,
            history: mockHistory
        });

    } catch (error) {
        console.error("History error:", error);
        return res.status(500).json({ error: 'Internal server error during history fetch.' });
    }
};

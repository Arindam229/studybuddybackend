// controllers/uploadController.js

/**
 * Handle image uploads.
 * This is a mocked endpoint that pretends to process an uploaded image.
 */
exports.handleUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock response returning parsed text, a summary, and an audio URL placeholder
        const mockParsedText = "This is a mock text extracted from the uploaded image. E=mc^2 indicates energy equals mass times the speed of light squared.";
        const mockSummary = "The uploaded notes explain the principle of mass-energy equivalence, represented by Einstein's famous equation E=mc^2.";
        const mockAudioUrl = "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3"; // Placeholder audio

        return res.status(200).json({
            success: true,
            message: 'Image processed successfully.',
            data: {
                extractedText: mockParsedText,
                summary: mockSummary,
                audioUrl: mockAudioUrl,
                filename: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ error: 'Internal server error during upload.' });
    }
};

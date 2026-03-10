// controllers/historyController.js
const { getContainer } = require('../db');

/**
 * Retrieve chat history for a given user.
 * Fetches data from Cosmos DB.
 */
exports.getHistory = async (req, res) => {
    try {
        const studentId = req.user.uid || req.user.email;
        const container = getContainer();

        let history = [];

        if (container) {
            const { resources } = await container.items.query({
                query: "SELECT * FROM c WHERE c.studentId = @id AND c.type = 'chat' ORDER BY c.createdAt ASC",
                parameters: [{ name: "@id", value: studentId }]
            }).fetchAll();

            history = resources.map(doc => ({
                id: doc.id,
                studentId: doc.studentId,
                role: doc.role === 'assistant' ? 'ai' : 'user', // Map assistant to ai for frontend compatibility
                text: doc.text,
                timestamp: doc.createdAt
            }));
        }

        return res.status(200).json({
            success: true,
            history: history
        });

    } catch (error) {
        console.error("History error:", error.message);
        return res.status(500).json({ error: 'Internal server error during history fetch.' });
    }
};

/**
 * Retrieve document processing history for a given user.
 * Fetches items with type 'document' from Cosmos DB.
 */
exports.getDocumentsHistory = async (req, res) => {
    try {
        const studentId = req.user.uid || req.user.email;
        const container = getContainer();

        let documents = [];

        if (container) {
            const { resources } = await container.items.query({
                query: "SELECT * FROM c WHERE c.studentId = @id AND c.type = 'document' ORDER BY c.createdAt DESC",
                parameters: [{ name: "@id", value: studentId }]
            }).fetchAll();

            documents = resources.map(doc => ({
                id: doc.id,
                studentId: doc.studentId,
                topic: doc.topic,
                summary: doc.summary,
                extractedText: doc.extracted_notes,
                flash_notes: doc.flash_notes,
                quiz: doc.quiz,
                flowchart: doc.flowchart,
                audio_base64: doc.audio_base64,
                timestamp: doc.createdAt,
                filename: doc.filename
            }));
        }

        return res.status(200).json({
            success: true,
            documents: documents
        });

    } catch (error) {
        console.error("Document history error:", error.message);
        return res.status(500).json({ error: 'Internal server error during document history fetch.' });
    }
};

/**
 * Retrieve a specific document by its ID.
 */
exports.getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const container = getContainer();

        if (container) {
            // Use a query to find the document regardless of partition key (studentId)
            // This is necessary for collaboration where users other than the creator need access.
            const { resources } = await container.items.query({
                query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'document'",
                parameters: [{ name: "@id", value: id }]
            }).fetchAll();

            if (resources.length === 0) {
                return res.status(404).json({ error: 'Document not found.' });
            }

            const doc = resources[0];

            return res.status(200).json({
                success: true,
                document: {
                    id: doc.id,
                    studentId: doc.studentId,
                    topic: doc.topic,
                    summary: doc.summary,
                    extractedText: doc.extracted_notes,
                    flash_notes: doc.flash_notes,
                    quiz: doc.quiz,
                    flowchart: doc.flowchart,
                    audio_base64: doc.audio_base64,
                    timestamp: doc.createdAt,
                    filename: doc.filename
                }
            });
        }

        return res.status(500).json({ error: 'Database not initialized.' });

    } catch (error) {
        console.error("Fetch document error:", error.message);
        return res.status(500).json({ error: 'Internal server error during document fetch.' });
    }
};

/**
 * Clear chat history for a given user.
 * Deletes all documents with type 'chat' for the student.
 */
exports.clearHistory = async (req, res) => {
    try {
        const studentId = req.user.uid || req.user.email;
        const container = getContainer();

        if (container) {
            // 1. Fetch all chat IDs for this user
            const { resources } = await container.items.query({
                query: "SELECT c.id, c.partitionKey FROM c WHERE c.studentId = @id AND c.type = 'chat'",
                parameters: [{ name: "@id", value: studentId }]
            }).fetchAll();

            // 2. Delete each item
            for (const item of resources) {
                // In Cosmos DB, if partitioning is by studentId, we MUST include it
                await container.item(item.id, studentId).delete();
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Chat history cleared successfully.'
        });

    } catch (error) {
        console.error("Clear history error:", error.message);
        return res.status(500).json({ error: 'Internal server error during history deletion.' });
    }
};

/**
 * Update a specific document (e.g., flowchart updates).
 */
exports.updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const container = getContainer();

        if (!container) {
            return res.status(500).json({ error: 'Database not initialized.' });
        }

        // 1. Fetch the existing document to get its partition key (studentId)
        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'document'",
            parameters: [{ name: "@id", value: id }]
        }).fetchAll();

        if (resources.length === 0) {
            return res.status(404).json({ error: 'Document not found.' });
        }

        const existingDoc = resources[0];
        const studentId = existingDoc.studentId;

        // 2. Perform a partial update (merge updates)
        const updatedDoc = {
            ...existingDoc,
            ...updates,
            id: existingDoc.id, // Ensure ID doesn't change
            studentId: existingDoc.studentId, // Ensure partition key doesn't change
            updatedAt: new Date().toISOString()
        };

        // 3. Upsert the document
        const { resource } = await container.items.upsert(updatedDoc);

        return res.status(200).json({
            success: true,
            message: 'Document updated successfully.',
            document: resource
        });

    } catch (error) {
        console.error("Update document error:", error.message);
        return res.status(500).json({ error: 'Internal server error during document update.' });
    }
};

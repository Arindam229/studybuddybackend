const express = require('express');
const multer = require('multer');

// Configure multer for handling file uploads (in-memory for now)
const upload = multer({ storage: multer.memoryStorage() });

const uploadController = require('../controllers/uploadController');
const chatController = require('../controllers/chatController');
const historyController = require('../controllers/historyController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Upload Routes (Protected)
router.post('/upload', verifyToken, upload.single('image'), uploadController.handleUpload);
router.post('/chat-upload', verifyToken, upload.single('image'), uploadController.handleChatUpload);

// Chat Route (Protected)
router.post('/chat', verifyToken, chatController.handleChat);

// History Routes (Protected)
router.get('/history', verifyToken, historyController.getHistory);
router.get('/history/documents', verifyToken, historyController.getDocumentsHistory);
router.get('/history/document/:id', verifyToken, historyController.getDocumentById);
router.put('/history/document/:id', verifyToken, historyController.updateDocument);
router.delete('/history', verifyToken, historyController.clearHistory);

module.exports = router;

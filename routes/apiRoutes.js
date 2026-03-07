const express = require('express');
const multer = require('multer');

// Configure multer for handling file uploads (in-memory for now)
const upload = multer({ storage: multer.memoryStorage() });

const uploadController = require('../controllers/uploadController');
const chatController = require('../controllers/chatController');
const historyController = require('../controllers/historyController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Upload Route (Protected)
router.post('/upload', verifyToken, upload.single('image'), uploadController.handleUpload);

// Chat Route (Protected)
router.post('/chat', verifyToken, chatController.handleChat);

// History Routes (Protected)
router.get('/history', verifyToken, historyController.getHistory);

module.exports = router;

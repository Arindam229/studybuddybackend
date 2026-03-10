require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const apiRoutes = require('./routes/apiRoutes');
const groupRoutes = require('./routes/groupRoutes');
const videoController = require('./controllers/videoController');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/', (req, res) => res.send('StudyBuddy API is Online'));
app.use('/api', apiRoutes);
app.use('/api/groups', groupRoutes);
app.get('/api/video/token', verifyToken, videoController.generateToken);

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Real-time Whiteboard sync
    socket.on('draw', (data) => {
        // Broadcast drawing data to others in the same room
        socket.to(data.roomId).emit('draw', data);
    });

    // Shared Summary navigation sync
    socket.on('sync-navigation', (data) => {
        socket.to(data.roomId).emit('sync-navigation', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Database initialization
const { initDb } = require('./db');

// Start Server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    initDb().catch(err => {
        console.error("❌ DB Init Error:", err.message);
    });
});

// Force Event Loop to stay active
const keepAlive = setInterval(() => {
    // Silent keep-alive
}, 1000 * 60 * 60);

// Debug Exit
process.on('beforeExit', (code) => {
    console.log(`[PROCESS] Process is about to exit with code: ${code}`);
});

process.on('SIGINT', () => {
    console.log("[PROCESS] Received SIGINT. Shutting down...");
    clearInterval(keepAlive);
    server.close(() => {
        console.log("[PROCESS] Server closed.");
        process.exit(0);
    });
});

// Export for Vercel
module.exports = app;

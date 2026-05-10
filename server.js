require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const User = require('./server/models/User');
const Message = require('./server/models/Message');
const Story = require('./server/models/Story');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ae_chat_uploads',
        resource_type: 'auto'
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
        res.json({ success: true, token, user: { id: user._id, username, email } });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
        res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Login failed' });
    }
});

app.get('/api/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        res.json({ success: true, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatarUrl } });
    } catch (err) {
        res.status(401).json({ success: false });
    }
});

// --- Profile Update Route ---
app.post('/api/profile', async (req, res) => {
    try {
        const { userId, username, avatarUrl } = req.body;
        const updateData = {};
        if (username) updateData.username = username;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        res.json({ success: true, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatarUrl } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Profile update failed' });
    }
});

// --- Media Upload Route ---
app.post('/api/upload', upload.single('media'), (req, res) => {
    try {
        res.json({ success: true, url: req.file.path });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// --- Stories Routes ---
app.post('/api/stories', upload.single('story'), async (req, res) => {
    try {
        const { userId, userName, type, content, backgroundColor } = req.body;
        const storyData = {
            userId,
            userName,
            type: type || 'image',
            userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`
        };

        if (req.file) {
            storyData.mediaUrl = req.file.path;
            // Basic detection for video
            if (req.file.mimetype.startsWith('video/')) storyData.type = 'video';
        } else if (type === 'text') {
            storyData.content = content;
            storyData.backgroundColor = backgroundColor || '#1a4a7c';
        }

        const story = await Story.create(storyData);
        res.json({ success: true, story });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Story upload failed' });
    }
});

app.get('/api/stories', async (req, res) => {
    try {
        const stories = await Story.find().sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.json([]);
    try {
        const results = await Message.find({ content: { $regex: q, $options: 'i' } }).limit(50);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp')
    .then(() => console.log('Connected to MongoDB Atlas successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Socket.io Events
io.on('connection', (socket) => {
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) return;
            socket.userId = user._id.toString();
            socket.join(socket.userId);
            socket.broadcast.emit('user_status_change', { userId: socket.userId, status: 'online' });
            
            const logs = await Message.find().sort({ timestamp: 1 });
            socket.emit('previousMessages', logs);
            socket.emit('auth_success', { id: user._id, username: user.username, email: user.email });
        } catch (err) {
            socket.emit('auth_error', 'Invalid token');
        }
    });

    socket.on('send_message', async (msg) => {
        try {
            await Message.create({
                sender: msg.senderId,
                senderName: msg.senderName,
                content: msg.content,
                mediaUrl: msg.mediaUrl,
                room: msg.receiverId || 'general',
                timestamp: new Date()
            });
            io.to(msg.receiverId).emit('receive_message', msg);
            socket.broadcast.emit('chatMessage', msg);
        } catch (err) {
            console.error('Message save error:', err);
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            io.emit('user_status_change', { userId: socket.userId, status: 'offline' });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`--- SERVER STARTED ON PORT ${PORT} ---`));

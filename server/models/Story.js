const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    type: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
    content: { type: String }, // For text stories
    mediaUrl: { type: String }, // For image/video stories
    backgroundColor: { type: String }, // For text stories
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

module.exports = mongoose.model('Story', StorySchema);

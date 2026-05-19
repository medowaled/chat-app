const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    senderName: {
        type: String
    },
    content: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    clearedBy: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('Message', MessageSchema);

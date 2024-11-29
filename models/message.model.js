const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    users: { type: [String], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    audioUrl: { type: String }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

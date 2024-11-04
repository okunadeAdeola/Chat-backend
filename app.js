const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Message = require('./models/message.model');
const { getAllUser } = require("./controllers/user.controller");
const User = require('./models/user.model');
const connectDB = require('./connection/mongoose.connection');
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const userRouter = require('./routes/user.route');
app.use('/user', userRouter);
connectDB();
const onlineUsers = new Map();
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    getAllUser(socket);
    socket.on('user-online', (userId) => {
        console.log(`User ${userId} is online with socket ID ${socket.id}`);
        onlineUsers.set(userId, socket.id);
        updateOnlineUsers();
    });
    socket.on('chat message', async ({ senderId, receiverId, content }) => {
        try {
            const message = new Message({ senderId, receiverId, content, users: [senderId, receiverId] });
            const savedMessage = await message.save();
            console.log('Message saved:', savedMessage);
            const user = await User.findOne({ _id: receiverId });
            const receiverSocketId = onlineUsers.get(receiverId) || user.socketId;
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('recievemessage', { senderId, receiverId, content, timestamp: savedMessage.timestamp });
            }
            socket.emit('messageSent', { success: true, message: 'Message sent successfully', userMessage: { senderId, receiverId, content, users: [{ senderId, receiverId }] } });
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('messageError', { success: false, error: error.message });
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let [userId, sockId] of onlineUsers.entries()) {
            if (sockId === socket.id) {
                console.log(`User ${userId} with socket ID ${socket.id} is now offline`);
                onlineUsers.delete(userId);
                break;
            }
        }
        updateOnlineUsers();
    });
    function updateOnlineUsers() {
        const onlineUserIds = Array.from(onlineUsers.keys());
        console.log('Online users:', onlineUserIds);
        io.emit('update-online-users', onlineUserIds);
    }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

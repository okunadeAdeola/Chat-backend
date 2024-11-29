const multer = require('multer');
const Message = require('../models/message.model');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

const sendVoiceMessage = async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!req.file) {
    return res.status(400).json({ status: false, message: 'No audio file uploaded' });
  }

  const audioUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const newMessage = new Message({
    senderId,
    receiverId,
    users: [senderId, receiverId],
    audioUrl,
  });

  try {
    await newMessage.save();
    res.status(200).json({ status: true, message: 'Voice message sent', audioUrl });
  } catch (err) {
    res.status(500).json({ status: false, message: 'Error saving voice message', error: err.message });
  }
};

module.exports = { upload, sendVoiceMessage };

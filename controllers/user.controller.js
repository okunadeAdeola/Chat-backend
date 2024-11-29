let User = require('../models/user.model')
let Message = require('../models/message.model')
const dotenv = require('dotenv')
const jwt = require("jsonwebtoken")
const nodemailer = require ('nodemailer')
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
dotenv.config();
const pass = process.env.PASS;
const USERMAIL = process.env.USERMAIL;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: USERMAIL,
      pass: pass
    }
  })
  const AdeySquare =
    "https://res.cloudinary.com/dl0nnmoah/image/upload/v1730298606/holi_dc2vfj.jpg";
const registerUser = (req, res) => {
    let form = new User(req.body);
    const { username, email, password } = req.body;
    const newUser = new User({
        username, email, password
    })
    newUser.save()
      .then((result) => {
        res.status(200).json({ status: true, message: "User signed up successfully", result });
        console.log('✔ user found', email);
        const mailOptions = {
          from: process.env.USER,
          to: email,
          subject: "Welcome to Adey square Chat App",
          html: `
            <div style="background-color: rgb(4,48,64); padding: 20px; color: rgb(179,148,113); border-radius: 5px">
              <img src="${AdeySquare}" alt="Captain College Logo" style="max-width: 150px; height: 130px; margin-bottom: 20px; margin-left: 300px;">
              <div style="text-align: center;">
              <p style="font-size: 18px;">Hello, ${username}!</p>
              <p style="font-size: 16px;">Welcome to Adey square Chat App! We're thrilled that you've chosen to register with us.</p>
              <p style="font-size: 16px;">If you have any questions or need assistance, feel free to reach out @Okunade288@gmail.com.</p>
              <p style="font-size: 16px;">Thank you for joining us.</p>
              <p style="font-size: 16px;">Best regards,</p>
              <p style="font-size: 16px;">The Adey square Chat App Team</p>
              </div>
            </div>
          `,
        };
          return transporter.sendMail(mailOptions)
      })
      .catch((err) => {
        console.error(err);
        if (err.code === 11000) {
            res.status(409).json({ status: false, message: "Duplicate user found" || 'Username already in use' });
        } else {
            res.status(400).json({ status: false, message: err.message || "Fill in appropriately" });
        }
    });    
  }
  const userLogin = async (req, res) => {
    console.log(req.body);
    const { password, email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (user) {
        const secrete = process.env.SECRET;
        user.validatePassword(password, (err, passwordSame) => {
          if (err) {
            res.status(500).json({ message: "Server error", status: false });
          } else {
            if (passwordSame) {
              const token = jwt.sign({ email }, secrete, { expiresIn: "12h" });
              console.log(token);
              res.status(200).json({ message: "User signed in successfully", status: true, token, user });
            } else {
              res.status(401).json({ message: "Wrong password or email", status: false });
            }
          }
        });
      }
       else {
        setTimeout(() => { 
          res.status(404).json({ message: "Wrong email or password", status: false });
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", status: false });
    }
  }
  const getDashboard = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing or malformed', status: false });
      }
      const token = authHeader.split(' ')[1];
      const secret = process.env.SECRET;  
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      const userDetail = await User.findOne({ email: decoded.email });
      if (!userDetail) {
        return res.status(404).json({ message: 'User not found', status: false });
      }
      res.json({ message: 'Congratulations', status: true, userDetail });
    } catch (err) {
      console.error('Error occurred:', err);
      res.status(500).json({ message: 'Internal Server Error', status: false });
    }
  };
  const getAllUser = (socket) => {
    socket.on("getUsers",({token})=>{
    const secrete = process.env.SECRET;
    jwt.verify(token, secrete, async(err, result) => { 
      if (err) {
        socket.emit("getUsers",{ message: "Error Occured", status: false })
      }
      else {
       await User.findOneAndUpdate({email:result.email},{socketId:socket.id})
        User.find({ }).select("-password")
          .then((userDetail) => {
            socket.emit("getUsers",{ message: "Congratulations", status: true,users: userDetail })
          })
      }
    })
    })
  };
  const fetchMessage = async (req, res) => {
    console.log(req.query)
    const { userId, receiverId } = req.query;
    try { 
      const messages = await Message.find({users:{$all:[userId,receiverId]}})
      console.log(messages)
        res.status(200).json({ status: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ status: false, error: 'Error fetching messages' });
    }
  };
  const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// app.post('/user/sendVoiceMessage', upload.single('audio'), async (req, res) => {
//     const { senderId, receiverId } = req.body;
//     const { path } = req.file;

//     const newMessage = new Message({
//         senderId,
//         receiverId,
//         users: [senderId, receiverId],
//         audioUrl: path,
//     });

//     await newMessage.save();
//     res.status(200).json({ status: true, audioUrl: path });
// });
  module.exports = {registerUser, userLogin, getDashboard, getAllUser, fetchMessage};
const express = require ('express')
const router = express.Router()
const { sendVoiceMessage, upload } = require('../controllers/audio.controller')
const {registerUser, userLogin, getDashboard, getAllUser, fetchMessage} = require('../controllers/user.controller');

router.post('/signup', registerUser)
router.post('/signin', userLogin)



router.post('/send-voice', upload.single('audio'), sendVoiceMessage);
router.get('/dashboard', getDashboard)
router.get('/getMessage', fetchMessage)








module.exports = router
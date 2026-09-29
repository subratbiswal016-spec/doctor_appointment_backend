const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, updateProfile, getAllUsers, getProfile, setPassword, loginWithPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/set-password', setPassword);
router.post('/login-password', loginWithPassword);
router.post('/update-profile', updateProfile);
router.get('/users', getAllUsers);
router.get('/profile', protect, getProfile);

module.exports = router;

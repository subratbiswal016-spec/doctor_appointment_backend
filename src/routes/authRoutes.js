const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, demoLogin, updateProfile, getAllUsers, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/demo-login', demoLogin);
router.post('/update-profile', updateProfile);
router.get('/users', getAllUsers);
router.get('/profile', protect, getProfile);

module.exports = router;

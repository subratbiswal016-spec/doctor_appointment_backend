const express = require('express');
const router = express.Router();
const { verifyPayment, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/verify', protect, verifyPayment);
router.post('/webhook', handleWebhook);

module.exports = router;

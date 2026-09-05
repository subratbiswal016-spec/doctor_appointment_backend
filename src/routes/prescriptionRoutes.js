const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptionByAppointment } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', createPrescription);
router.get('/appointment/:appointmentId', protect, getPrescriptionByAppointment);

module.exports = router;

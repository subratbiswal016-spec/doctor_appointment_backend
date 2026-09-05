const express = require('express');
const router = express.Router();
const {
  reserveSerial,
  getPatientAppointments,
  getDoctorQueue,
  updateAppointmentStatus
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/reserve', protect, reserveSerial);
router.get('/my-appointments', protect, getPatientAppointments);
router.get('/doctor-queue', getDoctorQueue);
router.patch('/status/:id', updateAppointmentStatus);

module.exports = router;

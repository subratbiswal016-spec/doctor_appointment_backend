const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  getDoctorSessions,
  getSessionSerialGrid,
  createDoctor,
  createSession,
  getSpecialities,
  getAdminStats,
  getAllAppointments,
  getDoctorDashboardStats,
  generateAvailability,
  updateDoctor,
  deleteSession
} = require('../controllers/doctorController');

router.get('/', getDoctors);
router.get('/specialities', getSpecialities);
router.get('/admin/stats', getAdminStats);
router.get('/admin/appointments', getAllAppointments);
router.get('/session/:sessionId/grid', getSessionSerialGrid);
router.get('/:doctorId/dashboard', getDoctorDashboardStats);
router.get('/:id', getDoctorById);
router.get('/:doctorId/sessions', getDoctorSessions);
router.post('/admin/create', createDoctor);
router.post('/admin/session', createSession);

// Doctor self-service: availability, profile update, remove a day
router.post('/:doctorId/availability', generateAvailability);
router.patch('/:id', updateDoctor);
router.delete('/session/:sessionId', deleteSession);

module.exports = router;

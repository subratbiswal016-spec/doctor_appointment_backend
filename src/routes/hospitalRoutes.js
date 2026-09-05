const express = require('express');
const router = express.Router();
const { getNearbyHospitals, geocode } = require('../controllers/hospitalController');

router.get('/', getNearbyHospitals);
router.get('/geocode', geocode); // GET /api/hospitals/geocode?q=...

module.exports = router;

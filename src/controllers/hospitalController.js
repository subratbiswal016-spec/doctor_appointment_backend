const https = require('https');
const Doctor = require('../models/Doctor');

// Haversine formula → distance in km between two lat/lng points
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/hospitals?lat=&lng=&search=
// Groups verified doctors by clinicName into "hospitals" and (when lat/lng given)
// sorts them nearest-first with a distance in km.
exports.getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng, search } = req.query;

    // Auto-seed if empty (same behaviour as the doctor list)
    const docCount = await Doctor.countDocuments();
    if (docCount === 0) {
      const { seedInitialData } = require('../utils/seedData');
      await seedInitialData();
    }

    let query = { isVerified: { $ne: false } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { speciality: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query);

    // Group by clinicName
    const map = {};
    for (const doc of doctors) {
      const key = doc.clinicName || 'Unknown Clinic';
      if (!map[key]) {
        map[key] = {
          clinicName: key,
          address: doc.address,
          city: doc.city,
          photo: doc.photo,
          latitude: doc.latitude,
          longitude: doc.longitude,
          specialities: new Set(),
          fees: [],
          ratings: [],
          reviewsTotal: 0,
          doctors: []
        };
      }
      const h = map[key];
      h.specialities.add(doc.speciality);
      h.fees.push(doc.fee);
      h.ratings.push(doc.rating || 0);
      h.reviewsTotal += doc.reviewsCount || 0;
      h.doctors.push(doc);
    }

    const hasCoords = lat !== undefined && lng !== undefined && lat !== '' && lng !== '';
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    let hospitals = Object.values(map).map((h) => {
      const avgRating = h.ratings.length
        ? h.ratings.reduce((a, b) => a + b, 0) / h.ratings.length
        : 0;
      const dist = hasCoords && !isNaN(userLat) && !isNaN(userLng)
        ? distanceKm(userLat, userLng, h.latitude, h.longitude)
        : null;

      return {
        clinicName: h.clinicName,
        address: h.address,
        city: h.city,
        photo: h.photo,
        latitude: h.latitude,
        longitude: h.longitude,
        doctorCount: h.doctors.length,
        specialities: Array.from(h.specialities),
        minFee: Math.min(...h.fees),
        avgRating: Math.round(avgRating * 10) / 10,
        reviewsTotal: h.reviewsTotal,
        distanceKm: dist !== null ? Math.round(dist * 10) / 10 : null,
        doctors: h.doctors
      };
    });

    // Sort: nearest first if we have coordinates, otherwise by rating
    if (hasCoords && !isNaN(userLat) && !isNaN(userLng)) {
      hospitals.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    } else {
      hospitals.sort((a, b) => b.avgRating - a.avgRating);
    }

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/geocode?q=Salt Lake Kolkata
// Proxies OpenStreetMap Nominatim to turn a typed place into coordinates.
exports.geocode = (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ success: false, message: 'q (query) is required', results: [] });
  }

  const path = `/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`;
  const options = {
    hostname: 'nominatim.openstreetmap.org',
    path,
    method: 'GET',
    headers: {
      'User-Agent': 'SerialDoctorApp/1.0 (doctor appointment booking demo)',
      'Accept': 'application/json'
    }
  };

  const request = https.request(options, (extRes) => {
    let body = '';
    extRes.on('data', (chunk) => (body += chunk));
    extRes.on('end', () => {
      try {
        const arr = JSON.parse(body);
        const results = (Array.isArray(arr) ? arr : []).map((p) => ({
          name: p.display_name,
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lon)
        }));
        return res.status(200).json({ success: true, results });
      } catch (e) {
        return res.status(200).json({ success: true, results: [] });
      }
    });
  });

  request.on('error', (err) => {
    return res.status(200).json({ success: false, message: err.message, results: [] });
  });
  request.setTimeout(8000, () => {
    request.destroy();
    return res.status(200).json({ success: false, message: 'Geocoding timed out', results: [] });
  });
  request.end();
};

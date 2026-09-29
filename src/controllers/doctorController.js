const Doctor = require('../models/Doctor');
const Session = require('../models/Session');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');

// Haversine distance in km
function distKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get all doctors with optional search query, city filter, and nearby sorting
exports.getDoctors = async (req, res) => {
  try {
    const { search, speciality, city, lat, lng } = req.query;

    let query = { isVerified: { $ne: false } };

    // Explicit City Filter
    if (city && city !== 'All') {
      query.city = { $regex: city.trim(), $options: 'i' };
    }

    // Speciality Filter
    if (speciality && speciality !== 'All') {
      query.speciality = { $regex: speciality.trim(), $options: 'i' };
    }

    // Search Query (matches name, speciality, clinic, city, address)
    if (search && search.trim().length > 0) {
      const term = search.trim();
      const searchRegex = { $regex: term, $options: 'i' };

      const searchConditions = [
        { name: searchRegex },
        { speciality: searchRegex },
        { clinicName: searchRegex },
        { city: searchRegex },
        { address: searchRegex },
        { about: searchRegex }
      ];

      if (query.city) {
        const existingCity = query.city;
        delete query.city;
        query.$and = [
          { city: existingCity },
          { $or: searchConditions }
        ];
      } else {
        query.$or = searchConditions;
      }
    }

    let doctors = await Doctor.find(query).sort({ rating: -1 });

    // If coordinates were sent, calculate distanceKm and filter nearby doctors
    const hasCoords = lat !== undefined && lng !== undefined && lat !== '' && lng !== '';
    if (hasCoords) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      if (!isNaN(uLat) && !isNaN(uLng)) {
        doctors = doctors.map((d) => {
          const obj = d.toObject();
          obj.distanceKm = Math.round(distKm(uLat, uLng, d.latitude, d.longitude) * 10) / 10;
          return obj;
        });

        // If coordinates are specified and no search text, filter out doctors farther than 60km
        if (!search || search.trim().length === 0) {
          doctors = doctors.filter((d) => (d.distanceKm ?? 0) <= 60);
          doctors.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
        }
      }
    }

    return res.status(200).json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Doctor Details by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Sessions for a Doctor
exports.getDoctorSessions = async (req, res) => {
  try {
    const { doctorId } = req.params;
    let sessions = await Session.find({ doctorId, isActive: true }).sort({ date: 1 });

    // Auto-create default session for today if doctor has no active sessions
    if (sessions.length === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDisplay = `Today, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      try {
        const defaultSession = await Session.create({
          doctorId,
          date: todayStr,
          displayDate: todayDisplay,
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          maxPatients: 30
        });
        sessions = [defaultSession];
      } catch (_) {
        sessions = await Session.find({ doctorId });
      }
    }

    return res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Real-time Serial Grid (1..30) for a Session
exports.getSessionSerialGrid = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).populate('doctorId');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const maxPatients = session.maxPatients || 30;
    const now = new Date();

    // Fetch all active appointments for this session
    const appointments = await Appointment.find({
      sessionId,
      $or: [
        { status: { $in: ['CONFIRMED', 'ARRIVED', 'COMPLETED'] } },
        { status: 'HELD', holdExpiresAt: { $gt: now } }
      ]
    });

    const bookedMap = {};
    const heldMap = {};

    appointments.forEach(app => {
      if (app.status === 'HELD') {
        heldMap[app.serialNumber] = {
          appointmentId: app._id,
          expiresInSeconds: Math.max(0, Math.floor((new Date(app.holdExpiresAt) - now) / 1000))
        };
      } else {
        bookedMap[app.serialNumber] = {
          appointmentId: app._id,
          patientName: app.patientName,
          status: app.status
        };
      }
    });

    // Build array of 1..maxPatients
    const serialGrid = [];
    let bookedCount = 0;
    let heldCount = 0;
    let availableCount = 0;

    for (let i = 1; i <= maxPatients; i++) {
      if (bookedMap[i]) {
        bookedCount++;
        serialGrid.push({
          serialNumber: i,
          status: 'BOOKED',
          patientName: bookedMap[i].patientName
        });
      } else if (heldMap[i]) {
        heldCount++;
        serialGrid.push({
          serialNumber: i,
          status: 'HELD',
          expiresInSeconds: heldMap[i].expiresInSeconds
        });
      } else {
        availableCount++;
        serialGrid.push({
          serialNumber: i,
          status: 'AVAILABLE'
        });
      }
    }

    return res.status(200).json({
      success: true,
      session,
      summary: {
        total: maxPatients,
        booked: bookedCount,
        held: heldCount,
        available: availableCount
      },
      serialGrid
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create New Doctor
exports.createDoctor = async (req, res) => {
  try {
    const doctorData = { isVerified: true, ...req.body };
    const doctor = await Doctor.create(doctorData);
    return res.status(201).json({ success: true, doctor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Session for Doctor
exports.createSession = async (req, res) => {
  try {
    const session = await Session.create(req.body);
    return res.status(201).json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: format a Date into a friendly display string e.g. "Mon, 08 Sep 2026"
function formatDisplayDate(dateObj) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const iso = (d) => d.toISOString().split('T')[0];
  const nice = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
  if (iso(dateObj) === iso(today)) return `Today · ${nice}`;
  if (iso(dateObj) === iso(tomorrow)) return `Tomorrow · ${nice}`;
  return nice;
}

// Doctor: Set / generate availability from weekly, monthly or specific-date rules.
// POST /api/doctors/:doctorId/availability
// body: {
//   mode: 'WEEKLY' | 'MONTHLY' | 'SPECIFIC',
//   weekdays: [1,3,5],        // 0=Sun..6=Sat (WEEKLY, or optional filter for MONTHLY)
//   weeksAhead: 4,            // WEEKLY: how many weeks to generate (default 4)
//   startDate: 'YYYY-MM-DD',  // MONTHLY range start
//   endDate: 'YYYY-MM-DD',    // MONTHLY range end
//   date: 'YYYY-MM-DD',       // SPECIFIC single date
//   startTime: '10:00 AM',
//   endTime: '01:00 PM',
//   maxPatients: 30
// }
exports.generateAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      mode = 'SPECIFIC',
      weekdays = [],
      weeksAhead = 4,
      startDate,
      endDate,
      date,
      startTime = '10:00 AM',
      endTime = '01:00 PM',
      maxPatients = 30
    } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Build the list of target dates (as YYYY-MM-DD strings)
    const targetDates = new Set();
    const iso = (d) => d.toISOString().split('T')[0];

    const addRange = (from, to, filterWeekdays) => {
      const cur = new Date(from);
      const end = new Date(to);
      let guard = 0;
      while (cur <= end && guard < 400) {
        if (!filterWeekdays || filterWeekdays.length === 0 || filterWeekdays.includes(cur.getDay())) {
          targetDates.add(iso(cur));
        }
        cur.setDate(cur.getDate() + 1);
        guard++;
      }
    };

    if (mode === 'SPECIFIC') {
      if (!date) return res.status(400).json({ success: false, message: 'date is required for SPECIFIC mode' });
      targetDates.add(date);
    } else if (mode === 'WEEKLY') {
      if (!Array.isArray(weekdays) || weekdays.length === 0) {
        return res.status(400).json({ success: false, message: 'weekdays are required for WEEKLY mode' });
      }
      const from = new Date();
      const to = new Date();
      to.setDate(from.getDate() + weeksAhead * 7);
      addRange(from, to, weekdays);
    } else if (mode === 'MONTHLY') {
      const from = startDate ? new Date(startDate) : new Date();
      let to;
      if (endDate) {
        to = new Date(endDate);
      } else {
        // Default: to end of the start month
        to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
      }
      addRange(from, to, weekdays); // weekdays optional filter
    } else {
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }

    // Upsert a Session for each target date (one window per date, matching the unique index)
    let created = 0;
    let updated = 0;
    for (const d of targetDates) {
      const displayDate = formatDisplayDate(new Date(d + 'T00:00:00'));
      const existing = await Session.findOne({ doctorId, date: d });
      if (existing) {
        existing.displayDate = displayDate;
        existing.startTime = startTime;
        existing.endTime = endTime;
        existing.maxPatients = maxPatients;
        existing.isActive = true;
        await existing.save();
        updated++;
      } else {
        await Session.create({
          doctorId,
          date: d,
          displayDate,
          startTime,
          endTime,
          maxPatients,
          isActive: true
        });
        created++;
      }
    }

    const sessions = await Session.find({ doctorId, isActive: true }).sort({ date: 1 });
    return res.status(201).json({
      success: true,
      message: `Availability saved: ${created} new, ${updated} updated day(s).`,
      created,
      updated,
      totalDays: targetDates.size,
      sessions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor: Update own details & location. PATCH /api/doctors/:id
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor/Admin: Remove an availability day (soft-deactivate the session).
// DELETE /api/doctors/session/:sessionId
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { isActive: false },
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    return res.status(200).json({ success: true, message: 'Availability removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all distinct doctor specialties
exports.getSpecialities = async (req, res) => {
  try {
    const dbSpecialities = await Doctor.distinct('speciality', { isVerified: { $ne: false } });
    const defaultList = ['Cardiologist', 'Dermatologist', 'General Physician', 'Pediatrician', 'Neurologist', 'Orthopedic', 'Gynecologist', 'ENT', 'Dentist'];
    const merged = Array.from(new Set([...defaultList, ...dbSpecialities]));
    return res.status(200).json({ success: true, specialities: ['All', ...merged] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Reset all data (wipe doctors, sessions, appointments)
exports.resetAllData = async (req, res) => {
  try {
    const delDoctors = await Doctor.deleteMany({});
    const delSessions = await Session.deleteMany({});
    const delAppointments = await Appointment.deleteMany({});
    const delPatients = await Patient.deleteMany({});
    return res.status(200).json({
      success: true,
      message: 'All data cleared',
      deleted: {
        doctors: delDoctors.deletedCount,
        sessions: delSessions.deletedCount,
        appointments: delAppointments.deletedCount,
        patients: delPatients.deletedCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Dashboard Stats (master system overview)
exports.getAdminStats = async (req, res) => {
  try {
    const doctorCount = await Doctor.countDocuments({ isVerified: { $ne: false } });
    const totalUsers = await Patient.countDocuments();
    const sessionCount = await Session.countDocuments({ isActive: true });

    const allConfirmed = await Appointment.find({ status: { $in: ['CONFIRMED', 'ARRIVED', 'COMPLETED'] } });
    const bookedCount = allConfirmed.length;
    const totalRevenue = allConfirmed.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Today's stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = await Session.countDocuments({ date: todayStr, isActive: true });
    const todayAppointments = allConfirmed.filter(a => {
      const d = new Date(a.createdAt).toISOString().split('T')[0];
      return d === todayStr;
    });
    const todayBooked = todayAppointments.length;
    const todayRevenue = todayAppointments.reduce((acc, a) => acc + (a.amount || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        activeDoctors: doctorCount,
        totalUsers,
        totalSessions: sessionCount,
        todaySessions,
        bookedTokens: bookedCount,
        todayBooked,
        totalRevenue,
        todayRevenue
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all appointments (master list)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: { $ne: 'HELD' } })
      .populate('doctorId')
      .populate('sessionId')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor Dashboard Stats (specific doctor overview)
exports.getDoctorDashboardStats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's sessions for this doctor
    const todaySessions = await Session.find({ doctorId, date: todayStr, isActive: true });
    const sessionIds = todaySessions.map(s => s._id);

    // All confirmed appointments for today's sessions
    const todayAppointments = await Appointment.find({
      doctorId,
      sessionId: { $in: sessionIds },
      status: { $in: ['CONFIRMED', 'ARRIVED', 'COMPLETED'] }
    }).sort({ serialNumber: 1 });

    const todayBooked = todayAppointments.length;
    const todayRevenue = todayAppointments.reduce((acc, a) => acc + (a.amount || 0), 0);
    const totalMax = todaySessions.reduce((acc, s) => acc + (s.maxPatients || 30), 0);

    // All-time stats for this doctor
    const allDoctorAppts = await Appointment.find({
      doctorId,
      status: { $in: ['CONFIRMED', 'ARRIVED', 'COMPLETED'] }
    });
    const totalPatients = allDoctorAppts.length;
    const doctorProfile = await Doctor.findById(doctorId);

    return res.status(200).json({
      success: true,
      doctorProfile: doctorProfile ? {
        id: doctorProfile._id,
        name: doctorProfile.name,
        photo: doctorProfile.photo,
        qualification: doctorProfile.qualification,
        speciality: doctorProfile.speciality,
        fee: doctorProfile.fee,
        clinicName: doctorProfile.clinicName,
        address: doctorProfile.address,
        city: doctorProfile.city,
        registrationNumber: doctorProfile.registrationNumber,
        experienceYears: doctorProfile.experienceYears,
        rating: doctorProfile.rating,
        reviewsCount: doctorProfile.reviewsCount
      } : null,
      stats: {
        todayBooked,
        todayMax: totalMax,
        todayRevenue,
        totalPatients,
        totalRevenue
      },
      todaySessions: todaySessions.map(s => ({
        id: s._id,
        date: s.date,
        displayDate: s.displayDate,
        startTime: s.startTime,
        endTime: s.endTime,
        maxPatients: s.maxPatients
      })),
      todayQueue: todayAppointments.map(a => ({
        id: a._id,
        serialNumber: a.serialNumber,
        patientName: a.patientName,
        patientAge: a.patientAge,
        patientPhone: a.patientPhone,
        patientGender: a.patientGender,
        status: a.status,
        amount: a.amount,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const Appointment = require('../models/Appointment');
const Session = require('../models/Session');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Reserve a serial token with 10-min hold
exports.reserveSerial = async (req, res) => {
  try {
    const { sessionId, serialNumber, patientName, patientAge, patientGender, patientPhone } = req.body;
    const patientId = req.user.id;

    if (!sessionId || !serialNumber) {
      return res.status(400).json({ success: false, message: 'Session ID and Serial Number are required' });
    }

    const session = await Session.findById(sessionId).populate('doctorId');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const doctor = session.doctorId;
    const now = new Date();
    const holdDurationMinutes = parseInt(process.env.HOLD_DURATION_MINUTES || '10');
    const holdExpiresAt = new Date(now.getTime() + holdDurationMinutes * 60 * 1000);

    // Step 0: Check if patient already has an active booking in this session
    const existingPatientBooking = await Appointment.findOne({
      sessionId,
      patientId,
      $or: [
        { status: { $in: ['CONFIRMED', 'ARRIVED', 'COMPLETED'] } },
        { status: 'HELD', holdExpiresAt: { $gt: now } }
      ]
    });

    if (existingPatientBooking) {
      return res.status(409).json({
        success: false,
        message: `You already have Serial #${existingPatientBooking.serialNumber} booked for this session.`
      });
    }

    // Step 1: Check if this serial is currently booked or held by someone else
    const existingLock = await Appointment.findOne({
      sessionId,
      serialNumber,
      $or: [
        { status: { $in: ['CONFIRMED', 'ARRIVED', 'COMPLETED'] } },
        { status: 'HELD', holdExpiresAt: { $gt: now } }
      ]
    });

    if (existingLock) {
      return res.status(409).json({
        success: false,
        message: `Serial #${serialNumber} was just taken by another patient! Please pick an available serial number.`
      });
    }

    // Step 2: Clean up expired holds and cancelled appointments for this serial
    await Appointment.deleteMany({
      sessionId,
      serialNumber,
      $or: [
        { status: 'HELD', holdExpiresAt: { $lte: now } },
        { status: 'CANCELLED' }
      ]
    });

    // Step 3: Atomic insertion into MongoDB (Unique index on sessionId + serialNumber enforces concurrency)
    let appointment;
    try {
      appointment = await Appointment.create({
        sessionId,
        doctorId: doctor._id,
        patientId,
        serialNumber,
        patientName: patientName || req.user.name || 'Patient',
        patientAge: patientAge || 28,
        patientGender: patientGender || 'Male',
        patientPhone: patientPhone || req.user.phone || '',
        status: 'HELD',
        holdExpiresAt,
        amount: doctor.fee
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: `Serial #${serialNumber} is currently locked by another user. Please choose another token.`
        });
      }
      throw dbErr;
    }

    return res.status(200).json({
      success: true,
      message: `Serial #${serialNumber} held successfully for ${holdDurationMinutes} minutes. Confirm booking to finalize.`,
      appointment: {
        id: appointment._id,
        serialNumber: appointment.serialNumber,
        status: appointment.status,
        holdExpiresAt: appointment.holdExpiresAt,
        amount: appointment.amount,
        doctorName: doctor.name,
        clinicName: doctor.clinicName,
        sessionDisplayDate: session.displayDate,
        sessionTime: `${session.startTime} - ${session.endTime}`
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Patient's Appointments List
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.user.id,
      status: { $ne: 'HELD' }
    })
      .populate('doctorId')
      .populate('sessionId')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Doctor Queue Appointments (Doctor Portal)
exports.getDoctorQueue = async (req, res) => {
  try {
    const { doctorId, sessionId } = req.query;
    let query = { status: { $in: ['CONFIRMED', 'ARRIVED', 'COMPLETED'] } };

    if (doctorId) query.doctorId = doctorId;
    if (sessionId) query.sessionId = sessionId;

    const appointments = await Appointment.find(query)
      .populate('patientId')
      .sort({ serialNumber: 1 });

    return res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor Portal: Update Appointment Status (e.g. ARRIVED, COMPLETED, CANCELLED)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    return res.status(200).json({ success: true, appointment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

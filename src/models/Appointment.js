const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  serialNumber: { type: Number, required: true }, // e.g. 1 to 30
  patientName: { type: String, required: true },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, required: true },
  patientPhone: { type: String, required: true },
  status: {
    type: String,
    enum: ['HELD', 'CONFIRMED', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
    default: 'HELD'
  },
  holdExpiresAt: { type: Date, required: true },
  paymentId: { type: String, default: '' },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// CRITICAL CONCURRENCY RULE: Compound unique index prevents double booking of serial number per session
appointmentSchema.index({ sessionId: 1, serialNumber: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

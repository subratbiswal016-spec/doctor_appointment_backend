const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD (e.g., "2026-08-27")
  displayDate: { type: String, required: true }, // e.g. "Thu, 27 Aug 2026"
  startTime: { type: String, required: true }, // e.g., "10:00 AM"
  endTime: { type: String, required: true }, // e.g., "01:00 PM"
  maxPatients: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

sessionSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema);

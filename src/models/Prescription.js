const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g. "1-0-1 (After food)"
  duration: { type: String, required: true }, // e.g. "5 days"
  instructions: { type: String, default: '' }
});

const prescriptionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  vitals: {
    bp: { type: String, default: '120/80' },
    pulse: { type: String, default: '72 bpm' },
    weight: { type: String, default: '68 kg' },
    temperature: { type: String, default: '98.6 F' }
  },
  diagnosis: { type: String, required: true },
  medicines: [medicineSchema],
  advice: { type: String, default: '' },
  followUpDate: { type: String, default: '' },
  pdfPath: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);

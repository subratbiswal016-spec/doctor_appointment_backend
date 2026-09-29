const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  age: { type: Number, default: 0 },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Unspecified'], default: 'Unspecified' },
  avatarUrl: { type: String, default: '' },
  password: { type: String, default: null },
  role: {
    type: String,
    enum: ['PATIENT', 'DOCTOR', 'ADMIN'],
    default: 'PATIENT'
  },
  profileComplete: { type: Boolean, default: false },
  // If role is DOCTOR, link to Doctor record
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: { type: String, default: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80' },
  qualification: { type: String, required: true },
  speciality: { type: String, required: true },
  experienceYears: { type: Number, default: 10 },
  registrationNumber: { type: String, required: true },
  fee: { type: Number, required: true }, // in INR (₹)
  about: { type: String, default: '' },  // short bio shown on the doctor profile
  email: { type: String, default: '' },
  languages: { type: [String], default: ['English', 'Hindi', 'Bengali'] },
  clinicName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, default: 'Kolkata' },
  latitude: { type: Number, default: 22.5726 },   // for "nearby" distance calculation
  longitude: { type: Number, default: 88.3639 },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 128 },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'serial_doctor_jwt_secret_key_2026_super_secure';

// Send OTP (Demo OTP = 123456)
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    console.log(`[Auth] OTP requested for phone: ${phone}. Demo OTP: 123456`);
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Use demo OTP: 123456',
      demoOtp: '123456'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP with ROLE-based login
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name, age, gender, role } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    if (otp !== '123456' && otp !== '000000') {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please enter 123456' });
    }

    const loginRole = (role || 'PATIENT').toUpperCase();

    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        phone,
        name: name || '',
        age: age || 0,
        gender: gender || 'Unspecified',
        role: loginRole,
        profileComplete: false
      });
    } else {
      user.role = loginRole;
      if (name) user.name = name;
      if (age) user.age = age;
      if (gender) user.gender = gender;
      await user.save();
    }

    // Also ensure Patient record exists
    let patient = await Patient.findOne({ phone });
    if (!patient) {
      patient = await Patient.create({
        phone,
        name: user.name || 'Patient',
        age: user.age || 28,
        gender: user.gender || 'Male'
      });
    }

    // If logging in as DOCTOR, find linked Doctor record
    let doctorProfile = null;
    if (loginRole === 'DOCTOR' && user.doctorId) {
      doctorProfile = await Doctor.findById(user.doctorId);
    }

    const token = jwt.sign(
      { id: patient._id, odid: user._id, phone: user.phone, role: loginRole, doctorId: user.doctorId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      role: loginRole,
      isNewUser,
      profileComplete: user.profileComplete || false,
      user: {
        id: user._id,
        patientId: patient._id,
        phone: user.phone,
        name: user.name,
        age: user.age,
        gender: user.gender,
        role: loginRole,
        doctorId: user.doctorId,
        profileComplete: user.profileComplete || false
      },
      doctorProfile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update User Profile (Patient fills name/age/gender, Doctor fills doctor details)
exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, age, gender, role, doctorData } = req.body;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update basic profile
    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    user.profileComplete = true;
    await user.save();

    // Update Patient record too
    await Patient.findOneAndUpdate(
      { phone: user.phone },
      { name: user.name, age: user.age, gender: user.gender },
      { upsert: true }
    );

    // If doctor role and doctorData provided, create/update doctor record
    let doctorProfile = null;
    if (role === 'DOCTOR' && doctorData) {
      if (user.doctorId) {
        // Update existing doctor
        doctorProfile = await Doctor.findByIdAndUpdate(user.doctorId, doctorData, { new: true });
      } else {
        // Create new doctor record and link to user
        doctorProfile = await Doctor.create({ ...doctorData, isVerified: true });
        user.doctorId = doctorProfile._id;
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        age: user.age,
        gender: user.gender,
        role: user.role,
        doctorId: user.doctorId,
        profileComplete: true
      },
      doctorProfile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get All Users with profiles
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    // Enrich doctor users with their doctor profile
    const enriched = [];
    for (const u of users) {
      const obj = u.toObject();
      if (u.doctorId) {
        obj.doctorProfile = await Doctor.findById(u.doctorId);
      }
      enriched.push(obj);
    }

    return res.status(200).json({ success: true, count: enriched.length, users: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Quick Demo Login (no OTP required)
exports.demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    const loginRole = (role || 'PATIENT').toUpperCase();

    let demoPhone, demoName;
    if (loginRole === 'ADMIN') {
      demoPhone = '9999000001';
      demoName = 'Admin User';
    } else if (loginRole === 'DOCTOR') {
      demoPhone = '9999000002';
      demoName = 'Dr. Demo';
    } else {
      demoPhone = '9876543210';
      demoName = 'Patient Demo';
    }

    let user = await User.findOne({ phone: demoPhone });
    if (!user) {
      user = await User.create({ phone: demoPhone, name: demoName, role: loginRole, profileComplete: true });
    } else {
      user.role = loginRole;
      await user.save();
    }

    let patient = await Patient.findOne({ phone: demoPhone });
    if (!patient) {
      patient = await Patient.create({ phone: demoPhone, name: demoName, age: 30, gender: 'Male' });
    }

    let doctorProfile = null;
    if (loginRole === 'DOCTOR') {
      if (user.doctorId) {
        doctorProfile = await Doctor.findById(user.doctorId);
      }
      if (!doctorProfile) {
        doctorProfile = await Doctor.findOne({ isVerified: true });
        if (doctorProfile) {
          user.doctorId = doctorProfile._id;
          await user.save();
        }
      }
    }

    const token = jwt.sign(
      { id: patient._id, odid: user._id, phone: user.phone, role: loginRole, doctorId: user.doctorId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      role: loginRole,
      isNewUser: false,
      profileComplete: true,
      user: {
        id: user._id,
        patientId: patient._id,
        phone: user.phone,
        name: user.name,
        age: user.age,
        gender: user.gender,
        role: loginRole,
        doctorId: user.doctorId,
        profileComplete: true
      },
      doctorProfile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, patient });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

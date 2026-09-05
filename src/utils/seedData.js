const Doctor = require('../models/Doctor');
const Session = require('../models/Session');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

const sampleDoctors = [
  // ---- Apollo Heart Clinic (Park Street) — 2 doctors ----
  {
    _id: '66ce22222222222222222221',
    name: 'Dr. A. K. Sharma',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MD (Cardiology)',
    speciality: 'Cardiologist',
    experienceYears: 16,
    registrationNumber: 'MCI-2008-84729',
    about: 'Senior interventional cardiologist with 16+ years treating heart disease, hypertension and arrhythmia. Known for a calm, patient-first approach.',
    email: 'dr.sharma@apolloheart.in',
    languages: ['English', 'Hindi', 'Bengali'],
    fee: 800,
    clinicName: 'Apollo Heart Clinic',
    address: '14/A Park Street, Chowringhee, Kolkata - 700016',
    city: 'Kolkata',
    latitude: 22.5535,
    longitude: 88.3520,
    rating: 4.9,
    reviewsCount: 240,
    isVerified: true
  },
  {
    _id: '66ce22222222222222222224',
    name: 'Dr. Meera Nair',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MD (General Medicine)',
    speciality: 'General Physician',
    experienceYears: 9,
    registrationNumber: 'WBMC-2015-33418',
    about: 'General physician focused on preventive care, diabetes and lifestyle management. Friendly with families and first-time patients.',
    email: 'dr.nair@apolloheart.in',
    languages: ['English', 'Hindi', 'Malayalam'],
    fee: 550,
    clinicName: 'Apollo Heart Clinic',
    address: '14/A Park Street, Chowringhee, Kolkata - 700016',
    city: 'Kolkata',
    latitude: 22.5535,
    longitude: 88.3520,
    rating: 4.7,
    reviewsCount: 132,
    isVerified: true
  },
  // ---- Skin & Glow Medicare (Salt Lake) ----
  {
    _id: '66ce22222222222222222222',
    name: 'Dr. Priya Patel',
    photo: 'https://images.unsplash.com/photo-1594824813566-78a01170461c?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, DVD (Dermatology)',
    speciality: 'Dermatologist',
    experienceYears: 11,
    registrationNumber: 'WBMC-2013-11928',
    about: 'Dermatologist specialising in acne, pigmentation and cosmetic skin care. Combines medical treatment with practical skincare advice.',
    email: 'dr.patel@skinglow.in',
    languages: ['English', 'Hindi', 'Gujarati'],
    fee: 650,
    clinicName: 'Skin & Glow Medicare',
    address: '88 Salt Lake, Sector 2, Kolkata - 700091',
    city: 'Kolkata',
    latitude: 22.5900,
    longitude: 88.4100,
    rating: 4.8,
    reviewsCount: 185,
    isVerified: true
  },
  // ---- Verma Family Wellness Center (Ballygunge) ----
  {
    _id: '66ce22222222222222222223',
    name: 'Dr. Rajesh Verma',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, DCH (Pediatrics)',
    speciality: 'General Physician',
    experienceYears: 20,
    registrationNumber: 'MCI-2004-44102',
    about: 'Trusted family physician with 20 years of experience in general medicine and child health. Popular for thorough, unhurried consultations.',
    email: 'dr.verma@vermawellness.in',
    languages: ['English', 'Hindi', 'Bengali'],
    fee: 500,
    clinicName: 'Verma Family Wellness Center',
    address: '42 Gariahat Road, Ballygunge, Kolkata - 700019',
    city: 'Kolkata',
    latitude: 22.5190,
    longitude: 88.3660,
    rating: 4.95,
    reviewsCount: 310,
    isVerified: true
  },
  // ---- City Care Multispeciality (Howrah) — 2 doctors ----
  {
    _id: '66ce22222222222222222225',
    name: 'Dr. S. Banerjee',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MS (Orthopedics)',
    speciality: 'Orthopedic',
    experienceYears: 14,
    registrationNumber: 'WBMC-2010-77201',
    about: 'Orthopedic surgeon experienced in joint replacement, sports injuries and fracture care. Emphasises non-surgical recovery where possible.',
    email: 'dr.banerjee@citycare.in',
    languages: ['English', 'Hindi', 'Bengali'],
    fee: 700,
    clinicName: 'City Care Multispeciality',
    address: '5 Grand Trunk Road, Howrah - 711101',
    city: 'Howrah',
    latitude: 22.5850,
    longitude: 88.3100,
    rating: 4.6,
    reviewsCount: 98,
    isVerified: true
  },
  {
    _id: '66ce22222222222222222226',
    name: 'Dr. Anjali Das',
    photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, DGO (Gynecology)',
    speciality: 'Gynecologist',
    experienceYears: 13,
    registrationNumber: 'WBMC-2011-55432',
    about: 'Gynecologist and obstetrician caring for women through pregnancy, fertility and routine health. Warm, reassuring consultation style.',
    email: 'dr.das@citycare.in',
    languages: ['English', 'Hindi', 'Bengali'],
    fee: 750,
    clinicName: 'City Care Multispeciality',
    address: '5 Grand Trunk Road, Howrah - 711101',
    city: 'Howrah',
    latitude: 22.5850,
    longitude: 88.3100,
    rating: 4.85,
    reviewsCount: 176,
    isVerified: true
  },

  // ================= ODISHA (Bhubaneswar) =================
  {
    _id: '66cf00000000000000000001',
    name: 'Dr. Sanjay Mishra',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MD (General Medicine)',
    speciality: 'General Physician',
    experienceYears: 15,
    registrationNumber: 'OMC-2009-20114',
    about: 'General physician in Bhubaneswar with wide experience in fever, infections and chronic disease management.',
    email: 'dr.mishra@kimscare.in',
    languages: ['English', 'Hindi', 'Odia'],
    fee: 500,
    clinicName: 'KIMS Care Bhubaneswar',
    address: 'Patia, Bhubaneswar - 751024',
    city: 'Bhubaneswar',
    latitude: 20.3558,
    longitude: 85.8166,
    rating: 4.7,
    reviewsCount: 120,
    isVerified: true
  },
  {
    _id: '66cf00000000000000000002',
    name: 'Dr. Rashmi Sahoo',
    photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, DGO',
    speciality: 'Gynecologist',
    experienceYears: 12,
    registrationNumber: 'OMC-2012-33218',
    about: 'Gynecologist supporting women\'s health, pregnancy care and fertility guidance in Bhubaneswar.',
    email: 'dr.sahoo@kimscare.in',
    languages: ['English', 'Hindi', 'Odia'],
    fee: 600,
    clinicName: 'KIMS Care Bhubaneswar',
    address: 'Patia, Bhubaneswar - 751024',
    city: 'Bhubaneswar',
    latitude: 20.3558,
    longitude: 85.8166,
    rating: 4.8,
    reviewsCount: 145,
    isVerified: true
  },

  // ================= BENGALURU =================
  {
    _id: '66cf00000000000000000003',
    name: 'Dr. Arjun Rao',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MD (Cardiology)',
    speciality: 'Cardiologist',
    experienceYears: 18,
    registrationNumber: 'KMC-2006-55021',
    about: 'Cardiologist in Bengaluru specialising in preventive heart care, echocardiography and hypertension.',
    email: 'dr.rao@blrhealthplus.in',
    languages: ['English', 'Hindi', 'Kannada'],
    fee: 900,
    clinicName: 'Bengaluru HealthPlus',
    address: 'Koramangala 5th Block, Bengaluru - 560095',
    city: 'Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    rating: 4.9,
    reviewsCount: 260,
    isVerified: true
  },
  {
    _id: '66cf00000000000000000004',
    name: 'Dr. Kavya Iyer',
    photo: 'https://images.unsplash.com/photo-1594824813566-78a01170461c?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MD (Dermatology)',
    speciality: 'Dermatologist',
    experienceYears: 10,
    registrationNumber: 'KMC-2014-77410',
    about: 'Dermatologist offering acne, hair-loss and cosmetic skin treatments with an evidence-based approach.',
    email: 'dr.iyer@blrhealthplus.in',
    languages: ['English', 'Kannada', 'Tamil'],
    fee: 700,
    clinicName: 'Bengaluru HealthPlus',
    address: 'Koramangala 5th Block, Bengaluru - 560095',
    city: 'Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    rating: 4.8,
    reviewsCount: 198,
    isVerified: true
  },

  // ================= CHENNAI =================
  {
    _id: '66cf00000000000000000005',
    name: 'Dr. Venkat Subramanian',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MS (Orthopedics)',
    speciality: 'Orthopedic',
    experienceYears: 17,
    registrationNumber: 'TNMC-2007-41290',
    about: 'Orthopedic surgeon in Chennai handling joint pain, spine and sports injuries with modern techniques.',
    email: 'dr.venkat@chennaimeditrust.in',
    languages: ['English', 'Tamil', 'Telugu'],
    fee: 800,
    clinicName: 'Chennai MediTrust',
    address: 'T. Nagar, Chennai - 600017',
    city: 'Chennai',
    latitude: 13.0400,
    longitude: 80.2337,
    rating: 4.85,
    reviewsCount: 210,
    isVerified: true
  },
  {
    _id: '66cf00000000000000000006',
    name: 'Dr. Lakshmi Menon',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, DCH (Pediatrics)',
    speciality: 'Pediatrician',
    experienceYears: 13,
    registrationNumber: 'TNMC-2011-63187',
    about: 'Pediatrician caring for newborns and children — vaccinations, growth and childhood illnesses.',
    email: 'dr.menon@chennaimeditrust.in',
    languages: ['English', 'Tamil', 'Malayalam'],
    fee: 650,
    clinicName: 'Chennai MediTrust',
    address: 'T. Nagar, Chennai - 600017',
    city: 'Chennai',
    latitude: 13.0400,
    longitude: 80.2337,
    rating: 4.9,
    reviewsCount: 175,
    isVerified: true
  },

  // ================= HYDERABAD =================
  {
    _id: '66cf00000000000000000007',
    name: 'Dr. Imran Khan',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MD (General Medicine)',
    speciality: 'General Physician',
    experienceYears: 14,
    registrationNumber: 'TSMC-2010-88123',
    about: 'General physician in Hyderabad focused on diabetes, thyroid and routine health check-ups.',
    email: 'dr.khan@hydcitycare.in',
    languages: ['English', 'Hindi', 'Telugu', 'Urdu'],
    fee: 550,
    clinicName: 'Hyderabad CityCare',
    address: 'Banjara Hills, Hyderabad - 500034',
    city: 'Hyderabad',
    latitude: 17.4126,
    longitude: 78.4482,
    rating: 4.75,
    reviewsCount: 160,
    isVerified: true
  },
  {
    _id: '66cf00000000000000000008',
    name: 'Dr. Sneha Reddy',
    photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80',
    qualification: 'MBBS, MD (Dermatology)',
    speciality: 'Dermatologist',
    experienceYears: 9,
    registrationNumber: 'TSMC-2015-90221',
    about: 'Dermatologist in Hyderabad offering skin, hair and laser treatments tailored to each patient.',
    email: 'dr.reddy@hydcitycare.in',
    languages: ['English', 'Telugu', 'Hindi'],
    fee: 700,
    clinicName: 'Hyderabad CityCare',
    address: 'Banjara Hills, Hyderabad - 500034',
    city: 'Hyderabad',
    latitude: 17.4126,
    longitude: 78.4482,
    rating: 4.8,
    reviewsCount: 138,
    isVerified: true
  }
];

const seedInitialData = async () => {
  try {
    const existingDoctors = await Doctor.countDocuments();
    if (existingDoctors === 0) {
      console.log('[Seed] Inserting initial sample doctors...');
      const createdDoctors = await Doctor.insertMany(sampleDoctors);

      // Create Sessions for today & tomorrow
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sessionsToCreate = [];

      for (const doc of createdDoctors) {
        sessionsToCreate.push({
          doctorId: doc._id,
          date: todayStr,
          displayDate: `Today, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          maxPatients: 30
        });

        sessionsToCreate.push({
          doctorId: doc._id,
          date: tomorrowStr,
          displayDate: `Tomorrow, ${tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          startTime: '05:00 PM',
          endTime: '08:00 PM',
          maxPatients: 30
        });
      }

      await Session.insertMany(sessionsToCreate);
      console.log('[Seed] Successfully created sessions for today & tomorrow (30 serials each).');
    }
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
  }
};

module.exports = { seedInitialData, sampleDoctors };

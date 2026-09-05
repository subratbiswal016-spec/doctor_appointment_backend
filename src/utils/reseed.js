// Non-destructive data refresh:
//  - Upserts all sample doctors by _id (adds new multi-city doctors,
//    and fills coordinates / about / email / languages on existing ones)
//  - Ensures every doctor has at least today's + tomorrow's session
// It does NOT delete existing appointments or sessions.
//
// Run:  npm run seed:refresh
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Doctor = require('../models/Doctor');
const Session = require('../models/Session');
const { sampleDoctors } = require('./seedData');

(async () => {
  await connectDB();
  try {
    let upserted = 0;
    for (const doc of sampleDoctors) {
      await Doctor.findByIdAndUpdate(doc._id, doc, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      });
      upserted++;
    }
    console.log(`[Refresh] Upserted ${upserted} doctors (new + updated).`);

    // Ensure sessions exist for each doctor
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const doctors = await Doctor.find();
    let sessionsCreated = 0;
    for (const d of doctors) {
      const count = await Session.countDocuments({ doctorId: d._id, isActive: true });
      if (count === 0) {
        await Session.create([
          {
            doctorId: d._id, date: todayStr,
            displayDate: `Today · ${new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}`,
            startTime: '10:00 AM', endTime: '01:00 PM', maxPatients: 30
          },
          {
            doctorId: d._id, date: tomorrowStr,
            displayDate: `Tomorrow · ${tomorrow.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}`,
            startTime: '05:00 PM', endTime: '08:00 PM', maxPatients: 30
          }
        ]);
        sessionsCreated += 2;
      }
    }
    console.log(`[Refresh] Created ${sessionsCreated} default sessions where missing.`);
    console.log('[Refresh] Done.');
  } catch (e) {
    console.error(`[Refresh Error] ${e.message}`);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();

const mongoose = require('mongoose');
const dns = require('dns');

// Fix SRV resolution issues on Windows local DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const connectDB = async () => {
  try {
    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB Connection Error] ${err.message}`);
    });
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serial_doctor_db');
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
  }
};

module.exports = connectDB;

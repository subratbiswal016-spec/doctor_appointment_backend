const Appointment = require('../models/Appointment');

const cleanExpiredHolds = async () => {
  try {
    const now = new Date();
    const result = await Appointment.deleteMany({
      status: 'HELD',
      holdExpiresAt: { $lt: now }
    });
    if (result.deletedCount > 0) {
      console.log(`[HoldCleaner] Released ${result.deletedCount} expired serial holds.`);
    }
  } catch (error) {
    console.error(`[HoldCleaner Error] ${error.message}`);
  }
};

const startHoldCleanerWorker = (intervalMs = 30000) => {
  // Run every 30 seconds
  setInterval(cleanExpiredHolds, intervalMs);
  console.log(`[HoldCleaner] Background worker started (Interval: ${intervalMs}ms)`);
};

module.exports = { cleanExpiredHolds, startHoldCleanerWorker };

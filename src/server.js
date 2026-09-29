require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startHoldCleanerWorker } = require('./utils/holdCleaner');

const PORT = process.env.PORT || 5000;

// Initialize Server
const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`SERIAL Doctor Backend API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });

  connectDB().then(() => {
    startHoldCleanerWorker(20000);
  }).catch(err => {
    console.error('[MongoDB] Connection failed:', err.message);
  });
};

// Global process error handlers to prevent crash on transient network disconnects
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

startServer();

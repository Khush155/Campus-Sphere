const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }

  try {
    const db = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true, // Auto-build indexes in dev/test. In production, prefer building them out-of-band.
    });

    isConnected = db.connections[0].readyState === 1;
    logger.info(`✅ MongoDB Connected successfully: ${db.connection.host}`);
  } catch (error) {
    logger.error(`❌ MongoDB Connection failure: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};

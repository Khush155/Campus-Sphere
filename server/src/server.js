const dns = require('dns');
// Programmatically override DNS servers to Google DNS to bypass local network DNS blocks/caching
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  logger.error(`❌ UNCAUGHT EXCEPTION! Shutting down server...`);
  logger.error(err.stack || err);
  process.exit(1);
});

let server;

// Establish database connection and start Express server listener
const startServer = async () => {
  await connectDB();

  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📄 API Documentation available at http://localhost:${env.PORT}/api-docs`);
  });
};

startServer();

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err) => {
  logger.error(`❌ UNHANDLED REJECTION! Shutting down server gracefully...`);
  logger.error(err.stack || err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

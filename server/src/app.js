const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const mongoose = require('mongoose');

const env = require('./config/env');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const { successResponse } = require('./utils/apiResponse');

const app = express();

// Set security HTTP headers
app.use(helmet());

// CORS configuration (allow credentials for httpOnly cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // In production, we'd whitelist specific client domains.
      // For development/local tests, reflect the request origin or allow localhost.
      if (!origin || origin.startsWith('http://localhost') || env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Serve static upload files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API Documentation Config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampusSphere ERP API Documentation',
      version: '1.0.0',
      description: 'API documentation for CampusSphere College ERP system - Phase 1 Setup',
      contact: {
        name: 'Senior Full-Stack Developer',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token to access protected endpoints',
        },
      },
    },
  },
  // Paths to files containing swagger docs definitions
  apis: [path.join(__dirname, './routes/*.js'), path.join(__dirname, './app.js')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health Check Endpoint
 *     description: Returns the status of the server, uptime, and database connection.
 *     responses:
 *       200:
 *         description: Server is healthy and running.
 */
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const healthData = {
    status: 'ok',
    uptime: `${Math.floor(process.uptime())}s`,
    database: isDbConnected ? 'connected' : 'disconnected',
    environment: env.NODE_ENV,
  };
  return successResponse(res, 200, 'Server health check passed', healthData);
});

// Root route redirect to docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Import and register routing files
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/college', require('./routes/collegeRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/fees', require('./routes/feeRoutes'));
app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/v1/faculty-assignments', require('./routes/facultyAssignmentRoutes'));

// Catch-all for unhandled routes
app.all('*', (req, res, next) => {
  const AppError = require('./utils/AppError');
  const ERROR_CODES = require('./constants/errorCodes');
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, ERROR_CODES.NOT_FOUND));
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;

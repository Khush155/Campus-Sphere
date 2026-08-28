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

// Set security HTTP headers (allowing cross-origin resource sharing for static files)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration (allow credentials for httpOnly cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, health checks)
      if (!origin) {
        return callback(null, true);
      }
      // Allow all localhost origins (development)
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      // In production, allow the Azure Container Apps domain (same-origin deployment)
      if (
        env.NODE_ENV === 'production' &&
        (origin.includes('azurecontainerapps.io') || origin.includes('azure.com'))
      ) {
        return callback(null, true);
      }
      // Allow all origins in non-production environments (test, development)
      if (env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Serve static upload files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Import and register routing files
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/college', require('./routes/collegeRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/assignments', require('./routes/assignmentRoutes'));
app.use('/api/v1/reports', require('./routes/reportRoutes'));
app.use('/api/v1/timetable', require('./routes/timetableRoutes'));
app.use('/api/v1/cross-dept-requests', require('./routes/requestRoutes'));
app.use('/api/v1/examinations', require('./routes/examinationRoutes'));
app.use('/api/v1/projects', require('./routes/projectRoutes'));
app.use('/api/v1/placements', require('./routes/placementRoutes'));
app.use('/api/v1/leaves', require('./routes/leaveRoutes'));
app.use('/api/v1/leave-requests', require('./routes/leaveRoutes'));
app.use('/api/v1/notices', require('./routes/noticeRoutes'));
app.use('/api/v1/complaints', require('./routes/complaintRoutes'));
app.use('/api/v1/documents', require('./routes/documentRoutes'));
app.use('/api/v1/meetings', require('./routes/meetingRoutes'));
app.use('/api/v1/attendance', require('./routes/attendanceRoutes'));
app.use('/api/v1/opportunities', require('./routes/opportunityRoutes'));
app.use('/api/v1/feedback', require('./routes/feedbackRoutes'));
app.use('/api/v1/academic-sessions', require('./routes/academicSessionRoutes'));
app.use('/api/v1/college-profile', require('./routes/collegeProfileRoutes'));
app.use('/api/v1/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/v1/admin', require('./routes/dashboardRoutes'));
app.use('/api/v1/promotions', require('./routes/promotionRoutes'));
app.use('/api/v1', require('./routes/pdfRoutes'));
app.use('/api/v1/faculty', require('./routes/facultyRoutes'));
app.use('/api/v1/exams', require('./routes/examRoutes'));
app.use('/api/v1/materials', require('./routes/materialRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/faculty-assignments', require('./routes/facultyAssignmentRoutes'));
app.use('/api/v1/academics', require('./routes/academicRoutes'));
app.use('/api/v1/fees', require('./routes/feeRoutes'));

// Serve static client build in production
if (env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Catch-all for unhandled API routes
app.all('*', (req, res, next) => {
  const AppError = require('./utils/AppError');
  const ERROR_CODES = require('./constants/errorCodes');
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, ERROR_CODES.NOT_FOUND));
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;

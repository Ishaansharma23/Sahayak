require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

// Database
const connectDB = require('./config/database');
const { initRedis } = require('./config/redis');

// Routes
const routes = require('./routes');

// Socket
const initSocketIO = require('./socket');

// Middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible in routes
app.set('io', io);

// Initialize Socket handlers
initSocketIO(io);

// Connect to Database
connectDB();

// Initialize Redis (optional)
initRedis();

// ==================== MIDDLEWARE ====================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Static files (for local uploads)
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LifeLine API - Real-Time Emergency Hospital & Women Safety Network',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      hospitals: '/api/hospitals',
      doctors: '/api/doctors',
      emergencies: '/api/emergencies',
      sos: '/api/sos',
      admin: '/api/admin',
      health: '/api/health',
    },
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏥 LifeLine API Server                                 ║
║   ──────────────────────────────────────────────         ║
║                                                          ║
║   🚀 Server running on port ${PORT}                         ║
║   📡 Environment: ${process.env.NODE_ENV || 'development'}                        ║
║   🔗 API URL: http://localhost:${PORT}/api                  ║
║   🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}            ║
║                                                          ║
║   📋 Available Endpoints:                                ║
║   • Auth:        /api/auth                               ║
║   • Hospitals:   /api/hospitals                          ║
║   • Doctors:     /api/doctors                            ║
║   • Emergencies: /api/emergencies                        ║
║   • SOS:         /api/sos                                ║
║   • Admin:       /api/admin                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, server, io };

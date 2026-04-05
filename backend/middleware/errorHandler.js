const AuditLog = require('../models/AuditLog');

/**
 * Error Response Class
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Async handler to avoid try-catch in controllers
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Log to audit if it's a server error
  if (err.statusCode >= 500 || !err.statusCode) {
    AuditLog.log({
      user: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: 'other',
      category: 'system',
      details: {
        error: err.message,
        stack: err.stack,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      status: 'failure',
      errorMessage: err.message,
    }).catch(() => {}); // Don't fail if logging fails
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(messages.join('. '), 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired', 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ErrorResponse('File size too large', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ErrorResponse('Too many files', 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  ErrorResponse,
  asyncHandler,
  errorHandler,
  notFound,
};

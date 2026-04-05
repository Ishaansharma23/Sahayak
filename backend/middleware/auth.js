const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies (primary method)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback to Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated',
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked. Please try again later.',
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth - attach user if token exists
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Token invalid/expired - continue without user
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

/**
 * Check if user is hospital admin and owns the hospital
 */
const authorizeHospitalAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (req.user.role !== 'hospital_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized - hospital admin only',
      });
    }

    const hospitalId = req.params.hospitalId || req.body.hospitalId;
    
    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Hospital ID is required',
      });
    }

    if (req.user.hospital.toString() !== hospitalId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this hospital',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is the doctor or admin
 */
const authorizeDoctorOrAdmin = async (req, res, next) => {
  try {
    if (['super_admin', 'hospital_admin'].includes(req.user.role)) {
      return next();
    }

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const doctorId = req.params.doctorId || req.params.id;
    
    if (req.user.doctorProfile && req.user.doctorProfile.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this profile',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  authorizeHospitalAdmin,
  authorizeDoctorOrAdmin,
};

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  updateLocation,
  onboarding,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { authValidators } = require('../validators');

// Public routes
router.post('/register', authValidators.register, register);
router.post('/login', authLimiter, authValidators.login, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Protected routes
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', authValidators.updateProfile, updateProfile);
router.put('/password', authValidators.changePassword, changePassword);
router.put('/location', updateLocation);
router.put('/onboarding', authValidators.onboarding, onboarding);

module.exports = router;

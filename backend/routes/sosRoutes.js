const express = require('express');
const router = express.Router();
const {
  triggerSOS,
  updateSOSLocation,
  getActiveSOS,
  getSOSAlert,
  cancelSOS,
  markFalseAlarm,
  acknowledgeSOS,
  addResponder,
  resolveSOS,
  getAllActiveSOS,
  getSOSHistory,
} = require('../controllers/sosController');

const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { sosLimiter } = require('../middleware/rateLimiter');
const { sosValidators } = require('../validators');

// User routes
router.post('/', optionalAuth, sosLimiter, sosValidators.create, triggerSOS);
router.get('/active', protect, getActiveSOS);
router.get('/history', protect, getSOSHistory);
router.get('/:id', optionalAuth, getSOSAlert);
router.put('/:id/location', optionalAuth, sosValidators.locationUpdate, updateSOSLocation);
router.put('/:id/cancel', optionalAuth, cancelSOS);
router.put('/:id/false-alarm', optionalAuth, markFalseAlarm);

// Hospital Admin / Super Admin routes
router.get('/all/active', protect, authorize('hospital', 'admin'), getAllActiveSOS);

router.put(
  '/:id/acknowledge',
  protect,
  authorize('hospital', 'admin'),
  acknowledgeSOS
);

router.post(
  '/:id/responders',
  protect,
  authorize('hospital', 'admin'),
  addResponder
);

router.put(
  '/:id/resolve',
  protect,
  authorize('hospital', 'admin'),
  resolveSOS
);

module.exports = router;

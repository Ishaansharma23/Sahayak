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

const { protect, authorize } = require('../middleware/auth');
const { sosLimiter } = require('../middleware/rateLimiter');
const { sosValidators } = require('../validators');

// All routes are protected
router.use(protect);

// User routes
router.post('/', sosLimiter, sosValidators.create, triggerSOS);
router.get('/active', getActiveSOS);
router.get('/history', getSOSHistory);
router.get('/:id', getSOSAlert);
router.put('/:id/location', sosValidators.locationUpdate, updateSOSLocation);
router.put('/:id/cancel', cancelSOS);
router.put('/:id/false-alarm', markFalseAlarm);

// Hospital Admin / Super Admin routes
router.get('/all/active', authorize('hospital_admin', 'super_admin'), getAllActiveSOS);

router.put(
  '/:id/acknowledge',
  authorize('hospital_admin', 'super_admin'),
  acknowledgeSOS
);

router.post(
  '/:id/responders',
  authorize('hospital_admin', 'super_admin'),
  addResponder
);

router.put(
  '/:id/resolve',
  authorize('hospital_admin', 'super_admin'),
  resolveSOS
);

module.exports = router;

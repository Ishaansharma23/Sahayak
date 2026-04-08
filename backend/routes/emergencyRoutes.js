const express = require('express');
const router = express.Router();
const {
  createEmergency,
  getMyEmergencies,
  getEmergency,
  getHospitalEmergencies,
  getActiveEmergencies,
  acceptEmergency,
  updateEmergencyStatus,
  updateAmbulanceLocation,
  cancelEmergency,
  rateEmergency,
} = require('../controllers/emergencyController');

const { protect, optionalAuth, authorize, authorizeHospitalAdmin } = require('../middleware/auth');
const { emergencyLimiter } = require('../middleware/rateLimiter');
const { emergencyValidators } = require('../validators');

// User routes
router.post('/', optionalAuth, emergencyLimiter, emergencyValidators.create, createEmergency);
router.get('/my-requests', protect, getMyEmergencies);
router.get('/:id', optionalAuth, getEmergency);
router.put('/:id/cancel', protect, cancelEmergency);
router.post('/:id/rate', protect, rateEmergency);

// Hospital admin routes
router.get(
  '/hospital/:hospitalId',
  protect,
  authorize('hospital', 'admin'),
  getHospitalEmergencies
);

router.get(
  '/hospital/:hospitalId/active',
  protect,
  authorize('hospital', 'admin'),
  getActiveEmergencies
);

router.put(
  '/:id/accept',
  protect,
  authorize('hospital', 'admin'),
  acceptEmergency
);

router.put(
  '/:id/status',
  protect,
  authorize('hospital', 'admin'),
  updateEmergencyStatus
);

router.put(
  '/:id/location',
  protect,
  authorize('hospital', 'admin'),
  updateAmbulanceLocation
);

module.exports = router;

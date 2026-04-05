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

const { protect, authorize, authorizeHospitalAdmin } = require('../middleware/auth');
const { emergencyLimiter } = require('../middleware/rateLimiter');
const { emergencyValidators } = require('../validators');

// All routes are protected
router.use(protect);

// User routes
router.post('/', emergencyLimiter, emergencyValidators.create, createEmergency);
router.get('/my-requests', getMyEmergencies);
router.get('/:id', getEmergency);
router.put('/:id/cancel', cancelEmergency);
router.post('/:id/rate', rateEmergency);

// Hospital admin routes
router.get(
  '/hospital/:hospitalId',
  authorize('hospital_admin', 'super_admin'),
  getHospitalEmergencies
);

router.get(
  '/hospital/:hospitalId/active',
  authorize('hospital_admin', 'super_admin'),
  getActiveEmergencies
);

router.put(
  '/:id/accept',
  authorize('hospital_admin', 'super_admin'),
  acceptEmergency
);

router.put(
  '/:id/status',
  authorize('hospital_admin', 'super_admin'),
  updateEmergencyStatus
);

router.put(
  '/:id/location',
  authorize('hospital_admin', 'super_admin'),
  updateAmbulanceLocation
);

module.exports = router;

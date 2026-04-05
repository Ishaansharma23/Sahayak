const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getNearbyHospitals,
  getHospital,
  createHospital,
  updateHospital,
  updateBedAvailability,
  updateAmbulanceAvailability,
  getHospitalStats,
  deleteHospital,
} = require('../controllers/hospitalController');

const { protect, authorize, authorizeHospitalAdmin } = require('../middleware/auth');
const { hospitalValidators } = require('../validators');

// Public routes
router.get('/', getHospitals);
router.get('/nearby', getNearbyHospitals);
router.get('/:id', getHospital);

// Protected routes
router.use(protect);

router.post('/', authorize('hospital_admin', 'super_admin'), hospitalValidators.create, createHospital);

router.put('/:id', authorize('hospital_admin', 'super_admin'), hospitalValidators.update, updateHospital);

router.put(
  '/:id/beds',
  authorize('hospital_admin', 'super_admin'),
  hospitalValidators.updateBed,
  updateBedAvailability
);

router.put(
  '/:id/ambulances',
  authorize('hospital_admin', 'super_admin'),
  updateAmbulanceAvailability
);

router.get('/:id/stats', authorize('hospital_admin', 'super_admin'), getHospitalStats);

router.delete('/:id', authorize('super_admin'), deleteHospital);

module.exports = router;

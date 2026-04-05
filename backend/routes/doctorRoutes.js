const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getAvailableDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  updateAvailability,
  toggleEmergencyAvailability,
  getDoctorSchedule,
  updateSchedule,
  deleteDoctor,
  getSpecializations,
} = require('../controllers/doctorController');

const { protect, authorize, authorizeDoctorOrAdmin } = require('../middleware/auth');
const { doctorValidators } = require('../validators');

// Public routes
router.get('/', getDoctors);
router.get('/available', getAvailableDoctors);
router.get('/specializations', getSpecializations);
router.get('/:id', getDoctor);
router.get('/:id/schedule', getDoctorSchedule);

// Protected routes
router.use(protect);

router.post('/', authorize('doctor', 'hospital_admin', 'super_admin'), doctorValidators.create, createDoctor);

router.put('/:id', authorizeDoctorOrAdmin, doctorValidators.update, updateDoctor);

router.put('/:id/availability', authorizeDoctorOrAdmin, doctorValidators.updateAvailability, updateAvailability);

router.put('/:id/emergency-toggle', authorizeDoctorOrAdmin, toggleEmergencyAvailability);

router.put('/:id/schedule', authorizeDoctorOrAdmin, updateSchedule);

router.delete('/:id', authorize('super_admin'), deleteDoctor);

module.exports = router;

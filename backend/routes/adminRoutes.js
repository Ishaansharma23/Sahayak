const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getPendingHospitals,
  verifyHospital,
  rejectHospital,
  suspendHospital,
  getPendingDoctors,
  verifyDoctor,
  rejectDoctor,
  getAuditLogs,
  getAnalytics,
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// All routes require admin
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-status', toggleUserStatus);

// Hospital management
router.get('/hospitals/pending', getPendingHospitals);
router.put('/hospitals/:id/verify', verifyHospital);
router.put('/hospitals/:id/reject', rejectHospital);
router.put('/hospitals/:id/suspend', suspendHospital);

// Doctor management
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/verify', verifyDoctor);
router.put('/doctors/:id/reject', rejectDoctor);

// Audit logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;

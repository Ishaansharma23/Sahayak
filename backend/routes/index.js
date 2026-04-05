const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const hospitalRoutes = require('./hospitalRoutes');
const doctorRoutes = require('./doctorRoutes');
const emergencyRoutes = require('./emergencyRoutes');
const sosRoutes = require('./sosRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/doctors', doctorRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/sos', sosRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeLine API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

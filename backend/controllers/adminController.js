const { User, Hospital, Doctor, Emergency, SOSAlert, AuditLog } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const { getPagination, paginationResponse } = require('../utils/helpers');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private (Super Admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalHospitals,
    verifiedHospitals,
    totalDoctors,
    verifiedDoctors,
    activeEmergencies,
    activeSOS,
    emergencyStats,
    recentEmergencies,
    dailyEmergencies,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Hospital.countDocuments(),
    Hospital.countDocuments({ verified: true }),
    Doctor.countDocuments(),
    Doctor.countDocuments({ verified: true }),
    Emergency.countDocuments({ status: { $nin: ['completed', 'cancelled', 'rejected'] } }),
    SOSAlert.countDocuments({ status: { $in: ['active', 'acknowledged', 'responding'] } }),
    Emergency.aggregate([
      { $match: { requestedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
    ]),
    Emergency.find()
      .populate('hospital', 'name')
      .populate('requestedBy', 'name phone')
      .sort({ requestedAt: -1 })
      .limit(10),
    Emergency.aggregate([
      { $match: { requestedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Calculate bed utilization
  const hospitalBedStats = await Hospital.aggregate([
    { $match: { verified: true } },
    {
      $group: {
        _id: null,
        totalBeds: { $sum: '$beds.total' },
        availableBeds: { $sum: '$beds.available' },
        totalICU: { $sum: '$beds.icu.total' },
        availableICU: { $sum: '$beds.icu.available' },
        totalVentilators: { $sum: '$beds.ventilators.total' },
        availableVentilators: { $sum: '$beds.ventilators.available' },
      },
    },
  ]);

  const bedStats = hospitalBedStats[0] || {
    totalBeds: 0,
    availableBeds: 0,
    totalICU: 0,
    availableICU: 0,
    totalVentilators: 0,
    availableVentilators: 0,
  };

  res.status(200).json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
      },
      hospitals: {
        total: totalHospitals,
        verified: verifiedHospitals,
        pending: totalHospitals - verifiedHospitals,
      },
      doctors: {
        total: totalDoctors,
        verified: verifiedDoctors,
        pending: totalDoctors - verifiedDoctors,
      },
      emergencies: {
        active: activeEmergencies,
        stats: emergencyStats.reduce((acc, curr) => {
          acc[curr._id] = { count: curr.count, avgResponseTime: Math.round(curr.avgResponseTime || 0) };
          return acc;
        }, {}),
      },
      sos: {
        active: activeSOS,
      },
      beds: bedStats,
      dailyEmergencies,
      recentEmergencies,
    },
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Super Admin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search, isActive } = req.query;

  const queryObj = {};
  if (role) queryObj.role = role;
  if (isActive !== undefined) queryObj.isActive = isActive === 'true';
  if (search) {
    queryObj.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(queryObj)
      .select('-password')
      .populate('hospital', 'name')
      .populate('doctorProfile', 'specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    ...paginationResponse(users, total, { page, limit }),
  });
});

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Super Admin)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const validRoles = ['user', 'hospital_admin', 'doctor', 'super_admin'];
  if (!validRoles.includes(role)) {
    throw new ErrorResponse('Invalid role', 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const previousRole = user.role;
  user.role = role;
  await user.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'role_change',
    category: 'admin',
    resource: { type: 'User', id: user._id, name: user.name },
    previousValue: { role: previousRole },
    newValue: { role },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'User role updated',
    user,
  });
});

/**
 * @desc    Toggle user status (activate/deactivate)
 * @route   PUT /api/admin/users/:id/toggle-status
 * @access  Private (Super Admin)
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  user.isActive = !user.isActive;
  await user.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: user.isActive ? 'account_unlock' : 'account_lock',
    category: 'admin',
    resource: { type: 'User', id: user._id, name: user.name },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    isActive: user.isActive,
  });
});

/**
 * @desc    Get pending hospital approvals
 * @route   GET /api/admin/hospitals/pending
 * @access  Private (Super Admin)
 */
const getPendingHospitals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [hospitals, total] = await Promise.all([
    Hospital.find({ status: 'pending' })
      .populate('admin', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Hospital.countDocuments({ status: 'pending' }),
  ]);

  res.status(200).json({
    success: true,
    ...paginationResponse(hospitals, total, { page, limit }),
  });
});

/**
 * @desc    Verify/Approve hospital
 * @route   PUT /api/admin/hospitals/:id/verify
 * @access  Private (Super Admin)
 */
const verifyHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  hospital.verified = true;
  hospital.status = 'approved';
  hospital.verifiedAt = new Date();
  hospital.verifiedBy = req.user.id;
  await hospital.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'hospital_verify',
    category: 'hospital',
    resource: { type: 'Hospital', id: hospital._id, name: hospital.name },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Hospital verified successfully',
    hospital,
  });
});

/**
 * @desc    Reject hospital
 * @route   PUT /api/admin/hospitals/:id/reject
 * @access  Private (Super Admin)
 */
const rejectHospital = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  hospital.verified = false;
  hospital.status = 'rejected';
  hospital.rejectionReason = reason;
  await hospital.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'hospital_reject',
    category: 'hospital',
    resource: { type: 'Hospital', id: hospital._id, name: hospital.name },
    details: { reason },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Hospital rejected',
    hospital,
  });
});

/**
 * @desc    Suspend hospital
 * @route   PUT /api/admin/hospitals/:id/suspend
 * @access  Private (Super Admin)
 */
const suspendHospital = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  hospital.status = 'suspended';
  hospital.isActive = false;
  hospital.rejectionReason = reason;
  await hospital.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'hospital_suspend',
    category: 'hospital',
    resource: { type: 'Hospital', id: hospital._id, name: hospital.name },
    details: { reason },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Hospital suspended',
    hospital,
  });
});

/**
 * @desc    Get pending doctor approvals
 * @route   GET /api/admin/doctors/pending
 * @access  Private (Super Admin)
 */
const getPendingDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [doctors, total] = await Promise.all([
    Doctor.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .populate('hospital', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments({ status: 'pending' }),
  ]);

  res.status(200).json({
    success: true,
    ...paginationResponse(doctors, total, { page, limit }),
  });
});

/**
 * @desc    Verify doctor
 * @route   PUT /api/admin/doctors/:id/verify
 * @access  Private (Super Admin)
 */
const verifyDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  doctor.verified = true;
  doctor.status = 'approved';
  doctor.verifiedAt = new Date();
  doctor.verifiedBy = req.user.id;
  await doctor.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'doctor_verify',
    category: 'doctor',
    resource: { type: 'Doctor', id: doctor._id, name: doctor.name },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Doctor verified successfully',
    doctor,
  });
});

/**
 * @desc    Reject doctor
 * @route   PUT /api/admin/doctors/:id/reject
 * @access  Private (Super Admin)
 */
const rejectDoctor = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  doctor.verified = false;
  doctor.status = 'rejected';
  doctor.rejectionReason = reason;
  await doctor.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'doctor_reject',
    category: 'doctor',
    resource: { type: 'Doctor', id: doctor._id, name: doctor.name },
    details: { reason },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Doctor rejected',
    doctor,
  });
});

/**
 * @desc    Get audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Super Admin)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { category, action, userId, startDate, endDate } = req.query;

  const queryObj = {};
  if (category) queryObj.category = category;
  if (action) queryObj.action = action;
  if (userId) queryObj.user = userId;
  if (startDate || endDate) {
    queryObj.timestamp = {};
    if (startDate) queryObj.timestamp.$gte = new Date(startDate);
    if (endDate) queryObj.timestamp.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(queryObj)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    ...paginationResponse(logs, total, { page, limit }),
  });
});

/**
 * @desc    Get analytics data
 * @route   GET /api/admin/analytics
 * @access  Private (Super Admin)
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

  const [
    emergencyTrends,
    sosTrends,
    hospitalUtilization,
    topHospitals,
    responseTimeStats,
  ] = await Promise.all([
    // Emergency trends by day
    Emergency.aggregate([
      { $match: { requestedAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
    // SOS trends by day
    SOSAlert.aggregate([
      { $match: { triggeredAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$triggeredAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Hospital bed utilization
    Hospital.aggregate([
      { $match: { verified: true } },
      {
        $project: {
          name: 1,
          totalBeds: '$beds.total',
          availableBeds: '$beds.available',
          utilizationRate: {
            $multiply: [
              { $divide: [{ $subtract: ['$beds.total', '$beds.available'] }, '$beds.total'] },
              100,
            ],
          },
        },
      },
      { $sort: { utilizationRate: -1 } },
      { $limit: 10 },
    ]),
    // Top hospitals by emergencies handled
    Emergency.aggregate([
      { $match: { status: 'completed', requestedAt: { $gte: daysAgo } } },
      { $group: { _id: '$hospital', count: { $sum: 1 }, avgResponseTime: { $avg: '$responseTime' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'hospitals',
          localField: '_id',
          foreignField: '_id',
          as: 'hospital',
        },
      },
      { $unwind: '$hospital' },
      { $project: { name: '$hospital.name', count: 1, avgResponseTime: { $round: ['$avgResponseTime', 0] } } },
    ]),
    // Response time statistics
    Emergency.aggregate([
      { $match: { status: 'completed', responseTime: { $exists: true }, requestedAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          totalEmergencies: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.status(200).json({
    success: true,
    analytics: {
      emergencyTrends,
      sosTrends,
      hospitalUtilization,
      topHospitals,
      responseTimeStats: responseTimeStats[0] || {},
    },
  });
});

module.exports = {
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
};

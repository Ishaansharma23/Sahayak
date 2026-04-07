const crypto = require('crypto');
const { SOSAlert, Hospital, User, AuditLog } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const { getPagination, paginationResponse } = require('../utils/helpers');
const { sendSOSAlertEmail } = require('../utils/email');

const getOrCreateGuestUser = async (name, phone) => {
  const defaultEmail = 'guest@lifeline.local';
  const defaultPhone = phone || '0000000000';

  const existing = await User.findOne({ email: defaultEmail });
  if (existing) {
    return existing;
  }

  const password = crypto.randomBytes(16).toString('hex');

  return User.create({
    name: name || 'Guest User',
    email: defaultEmail,
    phone: defaultPhone,
    password,
    role: 'user',
    isVerified: true,
    isActive: true,
  });
};

/**
 * @desc    Trigger SOS alert
 * @route   POST /api/sos
 * @access  Private (optional for guest)
 */
const triggerSOS = asyncHandler(async (req, res) => {
  const { type, location, description, batteryLevel, isCharging, contactPhone, contactName } = req.body;

  const requester = req.user || await getOrCreateGuestUser(contactName, contactPhone);

  // Check if user has active SOS
  const existingAlert = await SOSAlert.findOne({
    user: requester.id,
    status: { $in: ['active', 'acknowledged', 'responding'] },
  });

  if (existingAlert) {
    throw new ErrorResponse('You already have an active SOS alert', 400);
  }

  // Create SOS alert
  const sosAlert = await SOSAlert.create({
    user: requester.id,
    type: type || 'sos',
    location: {
      type: 'Point',
      coordinates: location.coordinates,
      address: location.address,
      accuracy: location.accuracy,
    },
    description,
    batteryLevel,
    isCharging,
    locationHistory: [{
      coordinates: location.coordinates,
      timestamp: new Date(),
      accuracy: location.accuracy,
    }],
    statusHistory: [{
      status: 'active',
      timestamp: new Date(),
    }],
  });

  // Get user with emergency contacts
  const user = await User.findById(requester.id);

  // Notify emergency contacts
  if (user.emergencyContacts && user.emergencyContacts.length > 0) {
    for (const contact of user.emergencyContacts) {
      sosAlert.notifiedContacts.push({
        name: contact.name,
        phone: contact.phone,
        relation: contact.relation,
        notifiedAt: new Date(),
        notificationStatus: 'sent',
      });
    }
    await sosAlert.save();

    // Send email/SMS alerts
    try {
      await sendSOSAlertEmail(user, sosAlert.location, user.emergencyContacts);
    } catch (error) {
      console.error('Failed to send SOS notifications:', error.message);
    }
  }

  // Alert nearby hospitals
  await sosAlert.alertNearbyHospitals(10); // 10km radius

  // Log action
  await AuditLog.log({
    user: requester._id,
    userEmail: requester.email,
    userRole: requester.role,
    action: 'sos_trigger',
    category: 'sos',
    resource: { type: 'SOSAlert', id: sosAlert._id, name: sosAlert.alertId },
    details: { type: sosAlert.type, location: sosAlert.location },
    ipAddress: req.ip,
    status: 'success',
  });

  // Real-time broadcast to hospitals and admin
  const io = req.app.get('io');
  if (io) {
    // Alert nearby hospitals
    for (const alertedHospital of sosAlert.alertedHospitals) {
      io.to(`hospital:${alertedHospital.hospital}`).emit('sosAlert', {
        alertId: sosAlert.alertId,
        user: {
          name: user.name,
          phone: user.phone,
        },
        location: sosAlert.location,
        type: sosAlert.type,
        distance: alertedHospital.distance,
        timestamp: new Date(),
      });
    }

    // Alert admin dashboard
    io.to('admin').emit('sosAlert', {
      alertId: sosAlert.alertId,
      sosAlert: {
        _id: sosAlert._id,
        user: { name: user.name, phone: user.phone },
        location: sosAlert.location,
        type: sosAlert.type,
        status: sosAlert.status,
      },
    });
  }

  res.status(201).json({
    success: true,
    message: 'SOS alert triggered successfully',
    alert: {
      _id: sosAlert._id,
      alertId: sosAlert.alertId,
      status: sosAlert.status,
      location: sosAlert.location,
      notifiedContacts: sosAlert.notifiedContacts.length,
      alertedHospitals: sosAlert.alertedHospitals.length,
    },
  });
});

/**
 * @desc    Update SOS location (continuous tracking)
 * @route   PUT /api/sos/:id/location
 * @access  Private
 */
const updateSOSLocation = asyncHandler(async (req, res) => {
  const { coordinates, accuracy, speed, heading } = req.body;

  const sosAlert = await SOSAlert.findById(req.params.id);

  if (!sosAlert) {
    throw new ErrorResponse('SOS alert not found', 404);
  }

  if (!req.user || sosAlert.user.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  if (!sosAlert.isTracking) {
    throw new ErrorResponse('Tracking has been disabled for this alert', 400);
  }

  await sosAlert.addLocation(coordinates, accuracy, speed, heading);

  // Broadcast location update
  const io = req.app.get('io');
  if (io) {
    // Update to responders
    io.to(`sos:${sosAlert._id}`).emit('sosLocationUpdate', {
      alertId: sosAlert.alertId,
      location: {
        coordinates,
        accuracy,
        speed,
        heading,
        timestamp: new Date(),
      },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Location updated',
  });
});

/**
 * @desc    Get active SOS for user
 * @route   GET /api/sos/active
 * @access  Private
 */
const getActiveSOS = asyncHandler(async (req, res) => {
  const sosAlert = await SOSAlert.findOne({
    user: req.user.id,
    status: { $in: ['active', 'acknowledged', 'responding'] },
  }).populate('alertedHospitals.hospital', 'name contact');

  res.status(200).json({
    success: true,
    alert: sosAlert,
  });
});

/**
 * @desc    Get SOS alert by ID
 * @route   GET /api/sos/:id
 * @access  Private
 */
const getSOSAlert = asyncHandler(async (req, res) => {
  const sosAlert = await SOSAlert.findById(req.params.id)
    .populate('user', 'name phone email emergencyContacts')
    .populate('alertedHospitals.hospital', 'name address contact');

  if (!sosAlert) {
    throw new ErrorResponse('SOS alert not found', 404);
  }

  // Check authorization
  if (req.user) {
    const isOwner = sosAlert.user._id.toString() === req.user.id;
    const isAdmin = ['super_admin', 'hospital_admin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new ErrorResponse('Not authorized', 403);
    }
  }

  res.status(200).json({
    success: true,
    alert: sosAlert,
  });
});

/**
 * @desc    Cancel SOS alert
 * @route   PUT /api/sos/:id/cancel
 * @access  Private
 */
const cancelSOS = asyncHandler(async (req, res) => {
  const sosAlert = await SOSAlert.findById(req.params.id);

  if (!sosAlert) {
    throw new ErrorResponse('SOS alert not found', 404);
  }

  if (req.user && sosAlert.user.toString() !== req.user.id && req.user.role !== 'super_admin') {
    throw new ErrorResponse('Not authorized', 403);
  }

  await sosAlert.updateStatus('cancelled', req.user?.id, 'Cancelled by user');

  if (req.user) {
    await AuditLog.log({
      user: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'sos_cancel',
      category: 'sos',
      resource: { type: 'SOSAlert', id: sosAlert._id, name: sosAlert.alertId },
      ipAddress: req.ip,
      status: 'success',
    });
  }

  // Broadcast cancellation
  const io = req.app.get('io');
  if (io) {
    io.to(`sos:${sosAlert._id}`).emit('sosCancelled', {
      alertId: sosAlert.alertId,
    });
  }

  res.status(200).json({
    success: true,
    message: 'SOS alert cancelled',
  });
});

/**
 * @desc    Mark as false alarm
 * @route   PUT /api/sos/:id/false-alarm
 * @access  Private
 */
const markFalseAlarm = asyncHandler(async (req, res) => {
  const sosAlert = await SOSAlert.findById(req.params.id);

  if (!sosAlert) {
    throw new ErrorResponse('SOS alert not found', 404);
  }

  if (!req.user || (sosAlert.user.toString() !== req.user.id && req.user.role !== 'super_admin')) {
    throw new ErrorResponse('Not authorized', 403);
  }

  await sosAlert.updateStatus('false_alarm', req.user.id, 'Marked as false alarm');

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'sos_false_alarm',
    category: 'sos',
    resource: { type: 'SOSAlert', id: sosAlert._id, name: sosAlert.alertId },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Marked as false alarm',
  });
});

/**
 * @desc    Acknowledge SOS alert (by hospital/responder)
 * @route   PUT /api/sos/:id/acknowledge
 * @access  Private (Hospital Admin, Super Admin)
 */
const acknowledgeSOS = asyncHandler(async (req, res) => {
  const sosAlert = await SOSAlert.findById(req.params.id);

  if (!sosAlert) {
    throw new ErrorResponse('SOS alert not found', 404);
  }

  await sosAlert.updateStatus('acknowledged', req.user.id, 'Acknowledged by responder');

  // Update hospital acknowledgment
  if (req.user.hospital) {
    const hospitalIndex = sosAlert.alertedHospitals.findIndex(
      h => h.hospital.toString() === req.user.hospital.toString()
    );
    if (hospitalIndex !== -1) {
      sosAlert.alertedHospitals[hospitalIndex].acknowledged = true;
      sosAlert.alertedHospitals[hospitalIndex].acknowledgedAt = new Date();
      sosAlert.alertedHospitals[hospitalIndex].acknowledgedBy = req.user.id;
      await sosAlert.save();
    }
  }

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'sos_acknowledge',
    category: 'sos',
    resource: { type: 'SOSAlert', id: sosAlert._id, name: sosAlert.alertId },
    ipAddress: req.ip,
    status: 'success',
  });

  // Notify user
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${sosAlert.user}`).emit('sosAcknowledged', {
      alertId: sosAlert.alertId,
      responder: req.user.name,
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: 'SOS acknowledged',
  });
});

/**
 * @desc    Add responder to SOS
 * @route   POST /api/sos/:id/responders
 * @access  Private (Hospital Admin, Super Admin)
 */
const addResponder = asyncHandler(async (req, res) => {
  const { type, name, phone, location } = req.body;

  const sosAlert = await SOSAlert.findById(req.params.id);

  if (!sosAlert) {
    throw new ErrorResponse('SOS alert not found', 404);
  }

  await sosAlert.addResponder({
    type,
    name,
    phone,
    location: location ? {
      type: 'Point',
      coordinates: location.coordinates,
    } : undefined,
    status: 'assigned',
  });

  await sosAlert.updateStatus('responding', req.user.id, `Responder ${name} assigned`);

  // Notify user
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${sosAlert.user}`).emit('responderAssigned', {
      alertId: sosAlert.alertId,
      responder: { type, name, phone },
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: 'Responder added',
  });
});

/**
 * @desc    Resolve SOS alert
 * @route   PUT /api/sos/:id/resolve
 * @access  Private (Hospital Admin, Super Admin)
 */
const resolveSOS = asyncHandler(async (req, res) => {
  const { resolutionType, notes } = req.body;

  const sosAlert = await SOSAlert.findById(req.params.id);

  if (!sosAlert) {
    throw new ErrorResponse('SOS alert not found', 404);
  }

  sosAlert.resolution = {
    type: resolutionType,
    notes,
    resolvedBy: req.user.id,
  };

  await sosAlert.updateStatus('resolved', req.user.id, notes);

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'sos_resolve',
    category: 'sos',
    resource: { type: 'SOSAlert', id: sosAlert._id, name: sosAlert.alertId },
    details: { resolutionType, notes },
    ipAddress: req.ip,
    status: 'success',
  });

  // Notify user
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${sosAlert.user}`).emit('sosResolved', {
      alertId: sosAlert.alertId,
      resolution: sosAlert.resolution,
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: 'SOS resolved',
  });
});

/**
 * @desc    Get all active SOS alerts (Admin)
 * @route   GET /api/sos/all/active
 * @access  Private (Hospital Admin, Super Admin)
 */
const getAllActiveSOS = asyncHandler(async (req, res) => {
  let query = SOSAlert.findActive();

  // Filter by hospital if hospital admin
  if (req.user.role === 'hospital_admin' && req.user.hospital) {
    query = query.where('alertedHospitals.hospital').equals(req.user.hospital);
  }

  const alerts = await query;

  res.status(200).json({
    success: true,
    count: alerts.length,
    alerts,
  });
});

/**
 * @desc    Get SOS history
 * @route   GET /api/sos/history
 * @access  Private
 */
const getSOSHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const queryObj = { user: req.user.id };

  const [alerts, total] = await Promise.all([
    SOSAlert.find(queryObj)
      .sort({ triggeredAt: -1 })
      .skip(skip)
      .limit(limit),
    SOSAlert.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    ...paginationResponse(alerts, total, { page, limit }),
  });
});

module.exports = {
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
};

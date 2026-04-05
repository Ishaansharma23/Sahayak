const { Emergency, Hospital, AuditLog } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const { getPagination, paginationResponse, estimateArrivalTime, calculateDistance } = require('../utils/helpers');
const { sendAmbulanceDispatchEmail } = require('../utils/email');

/**
 * @desc    Create emergency request (ambulance, bed, etc.)
 * @route   POST /api/emergencies
 * @access  Private
 */
const createEmergency = asyncHandler(async (req, res) => {
  const { type, priority, patientInfo, pickupLocation, hospitalId, notes } = req.body;

  let hospital = null;
  let destinationLocation = null;

  // If hospital is specified, get destination
  if (hospitalId) {
    hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new ErrorResponse('Hospital not found', 404);
    }
    destinationLocation = {
      type: 'Point',
      coordinates: hospital.location.coordinates,
      address: hospital.fullAddress,
    };
  } else {
    // Find nearest hospital with available resources
    const [nearestHospital] = await Hospital.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: pickupLocation.coordinates,
          },
          distanceField: 'distance',
          query: {
            verified: true,
            isActive: true,
            'ambulances.available': { $gt: 0 },
          },
          spherical: true,
        },
      },
      { $limit: 1 },
    ]);

    if (nearestHospital) {
      hospital = await Hospital.findById(nearestHospital._id);
      destinationLocation = {
        type: 'Point',
        coordinates: hospital.location.coordinates,
        address: hospital.fullAddress,
      };
    }
  }

  // Create emergency request
  const emergency = await Emergency.create({
    type,
    priority: priority || 'high',
    requestedBy: req.user.id,
    patientInfo,
    pickupLocation: {
      type: 'Point',
      coordinates: pickupLocation.coordinates,
      address: pickupLocation.address,
      landmark: pickupLocation.landmark,
    },
    hospital: hospital?._id,
    destinationLocation,
    notes,
    status: 'requested',
    statusHistory: [{
      status: 'requested',
      timestamp: new Date(),
      note: 'Emergency request created',
    }],
  });

  // Calculate estimated arrival
  if (hospital) {
    const distance = calculateDistance(
      pickupLocation.coordinates[1],
      pickupLocation.coordinates[0],
      hospital.location.coordinates[1],
      hospital.location.coordinates[0]
    );
    emergency.distance = Math.round(distance * 100) / 100;
    emergency.estimatedArrival = estimateArrivalTime(distance);
    await emergency.save();

    // Send notification to hospital
    try {
      await sendAmbulanceDispatchEmail(emergency, hospital);
    } catch (err) {
      console.error('Failed to send email:', err.message);
    }
  }

  // Log action
  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'emergency_request',
    category: 'emergency',
    resource: { type: 'Emergency', id: emergency._id, name: emergency.requestId },
    details: { type, priority, hospitalId: hospital?._id },
    ipAddress: req.ip,
    status: 'success',
  });

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.emit('newEmergency', {
      emergency: {
        id: emergency._id,
        requestId: emergency.requestId,
        type: emergency.type,
        priority: emergency.priority,
        status: emergency.status,
        patientName: emergency.patientInfo.name,
        location: emergency.pickupLocation,
      },
      hospitalId: hospital?._id,
    });

    // Notify specific hospital room
    if (hospital) {
      io.to(`hospital:${hospital._id}`).emit('emergencyRequest', emergency);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Emergency request created',
    emergency,
  });
});

/**
 * @desc    Get user's emergency requests
 * @route   GET /api/emergencies/my-requests
 * @access  Private
 */
const getMyEmergencies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [emergencies, total] = await Promise.all([
    Emergency.find({ requestedBy: req.user.id })
      .populate('hospital', 'name address contact')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit),
    Emergency.countDocuments({ requestedBy: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    ...paginationResponse(emergencies, total, { page, limit }),
  });
});

/**
 * @desc    Get emergency by ID
 * @route   GET /api/emergencies/:id
 * @access  Private
 */
const getEmergency = asyncHandler(async (req, res) => {
  const emergency = await Emergency.findById(req.params.id)
    .populate('hospital', 'name address contact')
    .populate('requestedBy', 'name phone');

  if (!emergency) {
    throw new ErrorResponse('Emergency not found', 404);
  }

  // Check authorization
  if (req.user.role === 'user' && emergency.requestedBy._id.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  res.status(200).json({
    success: true,
    emergency,
  });
});

/**
 * @desc    Get hospital's emergency requests
 * @route   GET /api/emergencies/hospital/:hospitalId
 * @access  Private (Hospital Admin)
 */
const getHospitalEmergencies = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const { status, priority } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const queryObj = { hospital: hospitalId };
  if (status) queryObj.status = status;
  if (priority) queryObj.priority = priority;

  const [emergencies, total] = await Promise.all([
    Emergency.find(queryObj)
      .populate('requestedBy', 'name phone')
      .sort({ priority: 1, requestedAt: -1 })
      .skip(skip)
      .limit(limit),
    Emergency.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    ...paginationResponse(emergencies, total, { page, limit }),
  });
});

/**
 * @desc    Get active emergencies for hospital
 * @route   GET /api/emergencies/hospital/:hospitalId/active
 * @access  Private (Hospital Admin)
 */
const getActiveEmergencies = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;

  const emergencies = await Emergency.findActive(hospitalId);

  res.status(200).json({
    success: true,
    count: emergencies.length,
    emergencies,
  });
});

/**
 * @desc    Update emergency status
 * @route   PUT /api/emergencies/:id/status
 * @access  Private (Hospital Admin, Super Admin)
 */
const updateEmergencyStatus = asyncHandler(async (req, res) => {
  const { status, note, ambulance, currentLocation } = req.body;

  const emergency = await Emergency.findById(req.params.id);

  if (!emergency) {
    throw new ErrorResponse('Emergency not found', 404);
  }

  // Validate status transition
  const validTransitions = {
    requested: ['accepted', 'rejected', 'cancelled'],
    accepted: ['dispatched', 'cancelled'],
    dispatched: ['on_the_way', 'cancelled'],
    on_the_way: ['arrived_pickup', 'cancelled'],
    arrived_pickup: ['patient_picked', 'cancelled'],
    patient_picked: ['en_route_hospital', 'cancelled'],
    en_route_hospital: ['arrived_hospital'],
    arrived_hospital: ['completed'],
  };

  if (validTransitions[emergency.status] && !validTransitions[emergency.status].includes(status)) {
    throw new ErrorResponse(`Invalid status transition from ${emergency.status} to ${status}`, 400);
  }

  // Update ambulance details if provided
  if (ambulance) {
    emergency.ambulance = ambulance;
  }

  // Update current location if provided
  if (currentLocation) {
    await emergency.updateLocation(currentLocation);
  }

  await emergency.updateStatus(status, req.user.id, note);

  // Update hospital ambulance count
  if (emergency.hospital) {
    const hospital = await Hospital.findById(emergency.hospital);
    
    if (status === 'dispatched' && hospital.ambulances.available > 0) {
      hospital.ambulances.available--;
      await hospital.save();
    } else if (status === 'completed') {
      hospital.ambulances.available++;
      hospital.stats.totalEmergencies++;
      if (emergency.responseTime) {
        hospital.stats.avgResponseTime = 
          (hospital.stats.avgResponseTime + emergency.responseTime) / 2;
      }
      await hospital.save();
    }
  }

  // Log action
  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: `emergency_${status.toLowerCase()}`,
    category: 'emergency',
    resource: { type: 'Emergency', id: emergency._id, name: emergency.requestId },
    details: { status, note },
    ipAddress: req.ip,
    status: 'success',
  });

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('emergencyUpdate', {
      emergencyId: emergency._id,
      requestId: emergency.requestId,
      status: emergency.status,
      ambulance: emergency.ambulance,
      currentLocation: emergency.currentLocation,
      estimatedArrival: emergency.estimatedArrival,
    });

    // Notify the requester
    io.to(`user:${emergency.requestedBy}`).emit('myEmergencyUpdate', emergency);
  }

  res.status(200).json({
    success: true,
    message: `Emergency status updated to ${status}`,
    emergency,
  });
});

/**
 * @desc    Update ambulance location
 * @route   PUT /api/emergencies/:id/location
 * @access  Private (Hospital Admin)
 */
const updateAmbulanceLocation = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;

  const emergency = await Emergency.findById(req.params.id);

  if (!emergency) {
    throw new ErrorResponse('Emergency not found', 404);
  }

  await emergency.updateLocation(coordinates);

  // Recalculate ETA
  if (emergency.status === 'on_the_way' || emergency.status === 'dispatched') {
    const distance = calculateDistance(
      coordinates[1],
      coordinates[0],
      emergency.pickupLocation.coordinates[1],
      emergency.pickupLocation.coordinates[0]
    );
    emergency.estimatedArrival = estimateArrivalTime(distance);
    await emergency.save();
  }

  // Emit real-time location
  const io = req.app.get('io');
  if (io) {
    io.emit('ambulanceLocation', {
      emergencyId: emergency._id,
      requestId: emergency.requestId,
      currentLocation: emergency.currentLocation,
      estimatedArrival: emergency.estimatedArrival,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Location updated',
    currentLocation: emergency.currentLocation,
    estimatedArrival: emergency.estimatedArrival,
  });
});

/**
 * @desc    Cancel emergency
 * @route   PUT /api/emergencies/:id/cancel
 * @access  Private
 */
const cancelEmergency = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const emergency = await Emergency.findById(req.params.id);

  if (!emergency) {
    throw new ErrorResponse('Emergency not found', 404);
  }

  // Check if user can cancel
  if (req.user.role === 'user' && emergency.requestedBy.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  // Check if cancelable
  const nonCancelableStatuses = ['completed', 'cancelled', 'arrived_hospital'];
  if (nonCancelableStatuses.includes(emergency.status)) {
    throw new ErrorResponse('This emergency cannot be cancelled', 400);
  }

  emergency.cancellationReason = reason;
  await emergency.updateStatus('cancelled', req.user.id, reason);

  // Restore ambulance availability
  if (emergency.hospital && emergency.status === 'dispatched') {
    await Hospital.findByIdAndUpdate(emergency.hospital, {
      $inc: { 'ambulances.available': 1 },
    });
  }

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'emergency_cancel',
    category: 'emergency',
    resource: { type: 'Emergency', id: emergency._id, name: emergency.requestId },
    details: { reason },
    ipAddress: req.ip,
    status: 'success',
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('emergencyCancelled', {
      emergencyId: emergency._id,
      requestId: emergency.requestId,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Emergency cancelled',
  });
});

/**
 * @desc    Rate emergency service
 * @route   POST /api/emergencies/:id/rate
 * @access  Private
 */
const rateEmergency = asyncHandler(async (req, res) => {
  const { score, feedback } = req.body;

  const emergency = await Emergency.findById(req.params.id);

  if (!emergency) {
    throw new ErrorResponse('Emergency not found', 404);
  }

  if (emergency.requestedBy.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  if (emergency.status !== 'completed') {
    throw new ErrorResponse('Can only rate completed emergencies', 400);
  }

  if (emergency.rating.score) {
    throw new ErrorResponse('Already rated', 400);
  }

  emergency.rating = {
    score,
    feedback,
    ratedAt: new Date(),
  };
  await emergency.save();

  // Update hospital rating
  if (emergency.hospital) {
    const hospital = await Hospital.findById(emergency.hospital);
    const newCount = hospital.rating.count + 1;
    const newAverage = ((hospital.rating.average * hospital.rating.count) + score) / newCount;
    
    hospital.rating.average = Math.round(newAverage * 10) / 10;
    hospital.rating.count = newCount;
    await hospital.save();
  }

  res.status(200).json({
    success: true,
    message: 'Thank you for your feedback',
  });
});

/**
 * @desc    Get emergency statistics
 * @route   GET /api/emergencies/stats
 * @access  Private (Admin)
 */
const getEmergencyStats = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [stats, dailyStats] = await Promise.all([
    Emergency.aggregate([
      { $match: { requestedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          avgResponseTime: { $avg: '$responseTime' },
          avgTotalTime: { $avg: '$totalTime' },
        },
      },
    ]),
    Emergency.aggregate([
      { $match: { requestedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    stats: stats[0] || {
      total: 0,
      completed: 0,
      cancelled: 0,
      avgResponseTime: 0,
      avgTotalTime: 0,
    },
    dailyStats,
  });
});

module.exports = {
  createEmergency,
  getMyEmergencies,
  getEmergency,
  getHospitalEmergencies,
  getActiveEmergencies,
  updateEmergencyStatus,
  updateAmbulanceLocation,
  cancelEmergency,
  rateEmergency,
  getEmergencyStats,
};

const { Hospital, Doctor, AuditLog } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const { getPagination, paginationResponse, parseSort } = require('../utils/helpers');
const { getCache, setCache, deleteCache } = require('../config/redis');

/**
 * @desc    Get all hospitals
 * @route   GET /api/hospitals
 * @access  Public
 */
const getHospitals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = parseSort(req.query.sort);

  // Build query
  const queryObj = { isActive: true };

  // Filters
  if (req.query.verified === 'true') queryObj.verified = true;
  if (req.query.city) queryObj['address.city'] = new RegExp(req.query.city, 'i');
  if (req.query.type) queryObj.type = req.query.type;
  if (req.query.hasICU === 'true') queryObj['beds.icu.available'] = { $gt: 0 };
  if (req.query.hasAmbulance === 'true') queryObj['ambulances.available'] = { $gt: 0 };
  if (req.query.search) {
    queryObj.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { 'address.city': new RegExp(req.query.search, 'i') },
    ];
  }

  // Try cache first
  const cacheKey = `hospitals:${JSON.stringify({ queryObj, page, limit, sort })}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, ...cached, fromCache: true });
  }

  const [hospitals, total] = await Promise.all([
    Hospital.find(queryObj)
      .select('-documents -images')
      .populate('doctors', 'name specialization availabilityStatus')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Hospital.countDocuments(queryObj),
  ]);

  const result = paginationResponse(hospitals, total, { page, limit });

  // Cache for 2 minutes
  await setCache(cacheKey, result, 120);

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @desc    Get nearby hospitals
 * @route   GET /api/hospitals/nearby
 * @access  Public
 */
const getNearbyHospitals = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 20, minBeds = 0 } = req.query;

  if (!lat || !lng) {
    throw new ErrorResponse('Latitude and longitude are required', 400);
  }

  const hospitals = await Hospital.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        distanceField: 'distance',
        maxDistance: parseFloat(maxDistance) * 1000, // km to meters
        query: {
          verified: true,
          isActive: true,
          'beds.available': { $gte: parseInt(minBeds) },
        },
        spherical: true,
      },
    },
    {
      $project: {
        name: 1,
        type: 1,
        address: 1,
        contact: 1,
        beds: 1,
        ambulances: 1,
        facilities: 1,
        distance: { $round: [{ $divide: ['$distance', 1000] }, 2] }, // Convert to km
        rating: 1,
      },
    },
    { $limit: 20 },
  ]);

  res.status(200).json({
    success: true,
    count: hospitals.length,
    hospitals,
  });
});

/**
 * @desc    Get single hospital
 * @route   GET /api/hospitals/:id
 * @access  Public
 */
const getHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id)
    .populate('doctors', 'name specialization availabilityStatus consultation rating')
    .populate('admin', 'name email');

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  res.status(200).json({
    success: true,
    hospital,
  });
});

/**
 * @desc    Create hospital
 * @route   POST /api/hospitals
 * @access  Private (Hospital Admin, Super Admin)
 */
const createHospital = asyncHandler(async (req, res) => {
  // Set admin to current user if hospital_admin
  if (req.user.role === 'hospital_admin') {
    req.body.admin = req.user.id;
  }

  const hospital = await Hospital.create(req.body);

  // Link hospital to admin user
  if (req.user.role === 'hospital_admin') {
    req.user.hospital = hospital._id;
    await req.user.save();
  }

  // Log action
  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'hospital_create',
    category: 'hospital',
    resource: { type: 'Hospital', id: hospital._id, name: hospital.name },
    ipAddress: req.ip,
    status: 'success',
  });

  // Clear cache
  await deleteCache('hospitals:*');

  res.status(201).json({
    success: true,
    message: 'Hospital created successfully',
    hospital,
  });
});

/**
 * @desc    Update hospital
 * @route   PUT /api/hospitals/:id
 * @access  Private (Hospital Admin - own hospital, Super Admin)
 */
const updateHospital = asyncHandler(async (req, res) => {
  let hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // Check authorization
  if (req.user.role === 'hospital_admin' && 
      hospital.admin.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized to update this hospital', 403);
  }

  // Prevent changing admin and verification status (super admin only)
  if (req.user.role !== 'super_admin') {
    delete req.body.admin;
    delete req.body.verified;
    delete req.body.status;
  }

  hospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'hospital_update',
    category: 'hospital',
    resource: { type: 'Hospital', id: hospital._id, name: hospital.name },
    details: { updatedFields: Object.keys(req.body) },
    ipAddress: req.ip,
    status: 'success',
  });

  await deleteCache('hospitals:*');

  res.status(200).json({
    success: true,
    message: 'Hospital updated successfully',
    hospital,
  });
});

/**
 * @desc    Update bed availability
 * @route   PUT /api/hospitals/:id/beds
 * @access  Private (Hospital Admin)
 */
const updateBedAvailability = asyncHandler(async (req, res) => {
  const { bedType, available } = req.body;

  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // Check authorization
  if (req.user.role === 'hospital_admin' && 
      hospital.admin.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  await hospital.updateBedAvailability(bedType, available);

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'bed_update',
    category: 'hospital',
    resource: { type: 'Hospital', id: hospital._id, name: hospital.name },
    details: { bedType, newAvailability: available },
    ipAddress: req.ip,
    status: 'success',
  });

  // Emit real-time update (will be handled by socket)
  const io = req.app.get('io');
  if (io) {
    io.emit('bedUpdate', {
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      bedType,
      available,
      timestamp: new Date(),
    });
  }

  await deleteCache('hospitals:*');

  res.status(200).json({
    success: true,
    message: 'Bed availability updated',
    beds: hospital.beds,
  });
});

/**
 * @desc    Update ambulance availability
 * @route   PUT /api/hospitals/:id/ambulances
 * @access  Private (Hospital Admin)
 */
const updateAmbulanceAvailability = asyncHandler(async (req, res) => {
  const { available } = req.body;

  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // Check authorization
  if (req.user.role === 'hospital_admin' && 
      hospital.admin.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  hospital.ambulances.available = available;
  await hospital.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('ambulanceUpdate', {
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      ambulancesAvailable: available,
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: 'Ambulance availability updated',
    ambulances: hospital.ambulances,
  });
});

/**
 * @desc    Get hospital statistics
 * @route   GET /api/hospitals/:id/stats
 * @access  Private (Hospital Admin)
 */
const getHospitalStats = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // Get emergency stats
  const Emergency = require('../models/Emergency');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [emergencyStats, doctorCount] = await Promise.all([
    Emergency.aggregate([
      {
        $match: {
          hospital: hospital._id,
          requestedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
    ]),
    Doctor.countDocuments({ hospital: hospital._id, isActive: true }),
  ]);

  const stats = {
    beds: hospital.beds,
    ambulances: hospital.ambulances,
    doctorCount,
    emergencyStats: emergencyStats.reduce((acc, curr) => {
      acc[curr._id] = { count: curr.count, avgResponseTime: Math.round(curr.avgResponseTime) };
      return acc;
    }, {}),
    rating: hospital.rating,
    lastBedUpdate: hospital.lastBedUpdate,
  };

  res.status(200).json({
    success: true,
    stats,
  });
});

/**
 * @desc    Delete hospital
 * @route   DELETE /api/hospitals/:id
 * @access  Private (Super Admin)
 */
const deleteHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  await hospital.deleteOne();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'hospital_delete',
    category: 'hospital',
    resource: { type: 'Hospital', id: hospital._id, name: hospital.name },
    ipAddress: req.ip,
    status: 'success',
  });

  await deleteCache('hospitals:*');

  res.status(200).json({
    success: true,
    message: 'Hospital deleted successfully',
  });
});

module.exports = {
  getHospitals,
  getNearbyHospitals,
  getHospital,
  createHospital,
  updateHospital,
  updateBedAvailability,
  updateAmbulanceAvailability,
  getHospitalStats,
  deleteHospital,
};

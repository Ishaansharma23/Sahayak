const { Doctor, Hospital, User, AuditLog } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const { getPagination, paginationResponse, parseSort } = require('../utils/helpers');

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public
 */
const getDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = parseSort(req.query.sort);

  // Build query
  const queryObj = { isActive: true };

  // Filters
  if (req.query.verified === 'true') queryObj.verified = true;
  if (req.query.specialization) queryObj.specialization = req.query.specialization;
  if (req.query.hospital) queryObj.hospital = req.query.hospital;
  if (req.query.available === 'true') queryObj.availabilityStatus = 'available';
  if (req.query.emergencyAvailable === 'true') queryObj.emergencyAvailable = true;
  if (req.query.maxFee) queryObj['consultation.fee'] = { $lte: parseInt(req.query.maxFee) };
  if (req.query.search) {
    queryObj.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { specialization: new RegExp(req.query.search, 'i') },
    ];
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(queryObj)
      .populate('hospital', 'name address')
      .populate('user', 'email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(queryObj),
  ]);

  const normalizedDoctors = doctors.map((doctor) => ({
    ...doctor,
    isVerified: doctor.verified,
    specialty: doctor.specialization,
    experience: doctor.experience?.years,
    qualification: doctor.qualifications?.[0]?.degree,
    consultationFee: doctor.consultation?.fee,
    isAvailable: doctor.availabilityStatus === 'available',
  }));

  const result = paginationResponse(normalizedDoctors, total, { page, limit });

  res.status(200).json({
    success: true,
    doctors: result.data,
    total: result.pagination.total,
    pagination: result.pagination,
  });
});

/**
 * @desc    Get available doctors
 * @route   GET /api/doctors/available
 * @access  Public
 */
const getAvailableDoctors = asyncHandler(async (req, res) => {
  const { specialization, hospitalId } = req.query;

  const doctors = await Doctor.findAvailable(specialization, hospitalId)
    .limit(50);

  res.status(200).json({
    success: true,
    count: doctors.length,
    doctors,
  });
});

/**
 * @desc    Get doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Public
 */
const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('hospital', 'name address contact')
    .populate('user', 'email phone')
    .lean();

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    doctor: doctor
      ? {
          ...doctor,
          isVerified: doctor.verified,
          specialty: doctor.specialization,
          experience: doctor.experience?.years,
          qualification: doctor.qualifications?.[0]?.degree,
          consultationFee: doctor.consultation?.fee,
          isAvailable: doctor.availabilityStatus === 'available',
          phone: doctor.contact?.phone,
          email: doctor.contact?.email,
        }
      : doctor,
  });
});

/**
 * @desc    Create doctor profile
 * @route   POST /api/doctors
 * @access  Private (Doctor, Hospital Admin, Super Admin)
 */
const createDoctor = asyncHandler(async (req, res) => {
  // If doctor is creating their own profile
  if (req.user.accountType === 'doctor') {
    const existingProfile = await Doctor.findOne({ user: req.user.id });
    if (existingProfile) {
      throw new ErrorResponse('Doctor profile already exists', 400);
    }
    req.body.user = req.user.id;
  }

  // If hospital admin is creating
  if (req.user.accountType === 'hospital') {
    req.body.hospital = req.user.hospitalProfile || req.user.hospital;
  }

  const doctor = await Doctor.create(req.body);

  // Update user with doctor profile reference
  if (req.body.user) {
    await User.findByIdAndUpdate(req.body.user, {
      doctorProfile: doctor._id,
      accountType: 'doctor',
    });
  }

  // Add doctor to hospital
  if (req.body.hospital) {
    await Hospital.findByIdAndUpdate(req.body.hospital, {
      $addToSet: { doctors: doctor._id },
    });
  }

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.accountType,
    action: 'doctor_create',
    category: 'doctor',
    resource: { type: 'Doctor', id: doctor._id, name: doctor.name },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(201).json({
    success: true,
    message: 'Doctor profile created successfully',
    doctor,
  });
});

/**
 * @desc    Update doctor profile
 * @route   PUT /api/doctors/:id
 * @access  Private (Owner Doctor, Hospital Admin, Super Admin)
 */
const updateDoctor = asyncHandler(async (req, res) => {
  let doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  // Check authorization
  if (req.user.accountType === 'doctor' && doctor.user.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  // Prevent changing certain fields
  if (req.user.accountType !== 'admin') {
    delete req.body.verified;
    delete req.body.status;
    delete req.body.user;
  }

  doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.accountType,
    action: 'doctor_update',
    category: 'doctor',
    resource: { type: 'Doctor', id: doctor._id, name: doctor.name },
    details: { updatedFields: Object.keys(req.body) },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Doctor profile updated successfully',
    doctor,
  });
});

/**
 * @desc    Update availability status
 * @route   PUT /api/doctors/:id/availability
 * @access  Private (Owner Doctor, Hospital Admin)
 */
const updateAvailability = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  // Check authorization
  if (req.user.accountType === 'doctor' && doctor.user.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  await doctor.toggleAvailability(status);

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.accountType,
    action: 'availability_change',
    category: 'doctor',
    resource: { type: 'Doctor', id: doctor._id, name: doctor.name },
    details: { newStatus: status },
    ipAddress: req.ip,
    status: 'success',
  });

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('doctorAvailability', {
      doctorId: doctor._id,
      doctorName: doctor.name,
      status,
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: 'Availability updated',
    availabilityStatus: doctor.availabilityStatus,
  });
});

/**
 * @desc    Toggle emergency availability
 * @route   PUT /api/doctors/:id/emergency-toggle
 * @access  Private (Owner Doctor)
 */
const toggleEmergencyAvailability = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  // Check authorization
  if (req.user.accountType === 'doctor' && doctor.user.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  doctor.emergencyAvailable = !doctor.emergencyAvailable;
  await doctor.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('doctorEmergencyUpdate', {
      doctorId: doctor._id,
      doctorName: doctor.name,
      emergencyAvailable: doctor.emergencyAvailable,
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: `Emergency availability ${doctor.emergencyAvailable ? 'enabled' : 'disabled'}`,
    emergencyAvailable: doctor.emergencyAvailable,
  });
});

/**
 * @desc    Get doctor schedule
 * @route   GET /api/doctors/:id/schedule
 * @access  Public
 */
const getDoctorSchedule = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).select('name schedule availabilityStatus');

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    schedule: doctor.schedule,
    currentStatus: doctor.availabilityStatus,
  });
});

/**
 * @desc    Update doctor schedule
 * @route   PUT /api/doctors/:id/schedule
 * @access  Private (Owner Doctor, Hospital Admin)
 */
const updateSchedule = asyncHandler(async (req, res) => {
  const { schedule } = req.body;

  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  // Check authorization
  if (req.user.accountType === 'doctor' && doctor.user.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized', 403);
  }

  doctor.schedule = schedule;
  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Schedule updated',
    schedule: doctor.schedule,
  });
});

/**
 * @desc    Delete doctor
 * @route   DELETE /api/doctors/:id
 * @access  Private (Super Admin)
 */
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new ErrorResponse('Doctor not found', 404);
  }

  // Remove from hospital
  if (doctor.hospital) {
    await Hospital.findByIdAndUpdate(doctor.hospital, {
      $pull: { doctors: doctor._id },
    });
  }

  await doctor.deleteOne();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.accountType,
    action: 'doctor_delete',
    category: 'doctor',
    resource: { type: 'Doctor', id: doctor._id, name: doctor.name },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Doctor profile deleted',
  });
});

/**
 * @desc    Get specializations list
 * @route   GET /api/doctors/specializations
 * @access  Public
 */
const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = [
    { value: 'general_medicine', label: 'General Medicine' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'gynecology', label: 'Gynecology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
    { value: 'ent', label: 'ENT' },
    { value: 'urology', label: 'Urology' },
    { value: 'nephrology', label: 'Nephrology' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
    { value: 'pulmonology', label: 'Pulmonology' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'emergency_medicine', label: 'Emergency Medicine' },
    { value: 'anesthesiology', label: 'Anesthesiology' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'plastic_surgery', label: 'Plastic Surgery' },
    { value: 'dental', label: 'Dental' },
    { value: 'other', label: 'Other' },
  ];

  res.status(200).json({
    success: true,
    specializations,
  });
});

module.exports = {
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
};

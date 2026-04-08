const { User, AuditLog } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { completeOnboarding, normalizeAccountType } = require('../services/onboardingService');

/**
 * Cookie options for JWT token
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000,
});

/**
 * Send token response with cookie
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.generateToken();

  // Remove password from response
  const userData = user.toObject();
  delete userData.password;

  res.status(statusCode)
    .cookie('token', token, getCookieOptions())
    .json({
      success: true,
      message,
      token,
      user: userData,
    });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, accountType } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    throw new ErrorResponse('User with this email or phone already exists', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    accountType: normalizeAccountType(accountType) || 'client',
  });

  // Log registration
  await AuditLog.log({
    user: user._id,
    userEmail: user.email,
    userRole: user.accountType,
    action: 'register',
    category: 'auth',
    resource: { type: 'User', id: user._id, name: user.name },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'success',
  });

  sendTokenResponse(user, 201, res, 'Registration successful');
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, accountType } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  if (!user.accountType && user.role) {
    user.accountType = normalizeAccountType(user.role);
    await user.save();
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new ErrorResponse('Account is temporarily locked. Please try again later.', 401);
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    await user.incrementLoginAttempts();
    
    await AuditLog.log({
      user: user._id,
      userEmail: user.email,
      action: 'login',
      category: 'auth',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'failure',
      errorMessage: 'Invalid password',
    });

    throw new ErrorResponse('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ErrorResponse('Account has been deactivated', 401);
  }

  const normalizedAccountType = normalizeAccountType(accountType);
  if (normalizedAccountType && user.accountType !== normalizedAccountType) {
    throw new ErrorResponse('Account type does not match this login', 401);
  }

  // Reset login attempts
  await user.resetLoginAttempts();

  // Log successful login
  await AuditLog.log({
    user: user._id,
    userEmail: user.email,
    userRole: user.accountType,
    action: 'login',
    category: 'auth',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'success',
  });

  sendTokenResponse(user, 200, res, 'Login successful');
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Log logout
  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.accountType,
    action: 'logout',
    category: 'auth',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'success',
  });

  res.status(200)
    .cookie('token', 'none', {
      httpOnly: true,
      expires: new Date(0),
    })
    .json({
      success: true,
      message: 'Logged out successfully',
    });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('hospitalProfile', 'name address certificateUrl')
    .populate('doctorProfile');

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'address', 'emergencyContacts', 'avatar'];
  
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  );

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.accountType,
    action: 'other',
    category: 'auth',
    resource: { type: 'User', id: req.user._id, name: user.name },
    details: { updatedFields: Object.keys(updates) },
    ipAddress: req.ip,
    status: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ErrorResponse('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  await AuditLog.log({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.accountType,
    action: 'password_change',
    category: 'auth',
    ipAddress: req.ip,
    status: 'success',
  });

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if email exists
    return res.status(200).json({
      success: true,
      message: 'If this email exists, a password reset link has been sent',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - LifeLine',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p>This link expires in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}`,
    });

    await AuditLog.log({
      user: user._id,
      userEmail: user.email,
      action: 'password_reset',
      category: 'auth',
      ipAddress: req.ip,
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorResponse('Email could not be sent', 500);
  }
});

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ErrorResponse('Invalid or expired reset token', 400);
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await AuditLog.log({
    user: user._id,
    userEmail: user.email,
    action: 'password_reset',
    category: 'auth',
    ipAddress: req.ip,
    status: 'success',
    details: { type: 'password_reset_completed' },
  });

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

/**
 * @desc    Update user location
 * @route   PUT /api/auth/location
 * @access  Private
 */
const updateLocation = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new ErrorResponse('Invalid coordinates', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      location: {
        type: 'Point',
        coordinates,
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Location updated',
    location: user.location,
  });
});

/**
 * @desc    Complete onboarding and create profiles
 * @route   PUT /api/auth/onboarding
 * @access  Private
 */
const onboarding = asyncHandler(async (req, res) => {
  const result = await completeOnboarding(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Onboarding completed',
    user: result.user,
    doctorProfile: result.doctorProfile,
    hospitalProfile: result.hospitalProfile,
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  updateLocation,
  onboarding,
};

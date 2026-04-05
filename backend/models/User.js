const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Schema
 * Supports multiple roles: user, hospital_admin, doctor, super_admin
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password in queries
  },
  role: {
    type: String,
    enum: ['user', 'hospital_admin', 'doctor', 'super_admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: '',
  },
  emergencyContacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { type: String },
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  // For hospital_admin role
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
  },
  // For doctor role
  doctorProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT token
 * @returns {string} JWT token
 */
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Check if account is locked
 * @returns {boolean}
 */
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Increment login attempts
 */
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 1 hour
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 };
  }
  
  await this.updateOne(updates);
};

/**
 * Reset login attempts on successful login
 */
userSchema.methods.resetLoginAttempts = async function() {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

module.exports = mongoose.model('User', userSchema);

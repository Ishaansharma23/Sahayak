const mongoose = require('mongoose');

/**
 * Emergency Request Schema
 * Handles ambulance requests and emergency situations
 */
const emergencySchema = new mongoose.Schema({
  // Request details
  requestId: {
    type: String,
    unique: true,
    required: true,
  },
  type: {
    type: String,
    enum: ['ambulance', 'emergency_bed', 'doctor_visit', 'blood', 'oxygen', 'other'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'high',
  },
  // Requestor
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientInfo: {
    name: { type: String, required: true },
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: String,
    condition: String,
    medicalHistory: String,
    currentMedications: String,
    allergies: String,
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'unknown'],
    },
  },
  // Location
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    address: String,
    landmark: String,
  },
  // Destination hospital
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
  },
  destinationLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
    address: String,
  },
  // Status tracking
  status: {
    type: String,
    enum: [
      'requested',
      'accepted',
      'dispatched',
      'on_the_way',
      'arrived_pickup',
      'patient_picked',
      'en_route_hospital',
      'arrived_hospital',
      'completed',
      'cancelled',
      'rejected',
    ],
    default: 'requested',
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  // Ambulance details
  ambulance: {
    vehicleNumber: String,
    type: { type: String, enum: ['basic', 'advanced', 'pediatric', 'neonatal'] },
    driver: {
      name: String,
      phone: String,
    },
    paramedic: {
      name: String,
      phone: String,
    },
  },
  // Real-time tracking
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
    updatedAt: Date,
  },
  locationHistory: [{
    coordinates: [Number],
    timestamp: { type: Date, default: Date.now },
  }],
  // Time tracking
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: Date,
  dispatchedAt: Date,
  arrivedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  estimatedArrival: Date,
  actualArrival: Date,
  // Response metrics
  responseTime: Number, // in minutes
  totalTime: Number, // in minutes
  distance: Number, // in km
  // Notes
  notes: String,
  hospitalNotes: String,
  cancellationReason: String,
  rejectionReason: String,
  // Billing
  billing: {
    estimatedCost: Number,
    actualCost: Number,
    isPaid: { type: Boolean, default: false },
    paymentMethod: String,
    paymentId: String,
  },
  // Ratings
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedAt: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
emergencySchema.index({ pickupLocation: '2dsphere' });
emergencySchema.index({ currentLocation: '2dsphere' });
emergencySchema.index({ requestedBy: 1 });
emergencySchema.index({ hospital: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ requestedAt: -1 });
emergencySchema.index({ priority: 1 });

/**
 * Pre-save middleware to generate request ID
 */
emergencySchema.pre('save', async function(next) {
  if (!this.requestId) {
    const count = await this.constructor.countDocuments();
    this.requestId = `EMR-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

/**
 * Update status with history
 */
emergencySchema.methods.updateStatus = async function(newStatus, userId, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy: userId,
  });

  // Update relevant timestamps
  const now = new Date();
  switch (newStatus) {
    case 'accepted':
      this.acceptedAt = now;
      break;
    case 'dispatched':
      this.dispatchedAt = now;
      break;
    case 'arrived_pickup':
    case 'arrived_hospital':
      this.arrivedAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      if (this.requestedAt) {
        this.totalTime = Math.round((now - this.requestedAt) / 60000);
      }
      break;
    case 'cancelled':
      this.cancelledAt = now;
      break;
  }

  // Calculate response time when accepted
  if (newStatus === 'accepted' && this.requestedAt) {
    this.responseTime = Math.round((now - this.requestedAt) / 60000);
  }

  await this.save();
  return this;
};

/**
 * Update current location
 */
emergencySchema.methods.updateLocation = async function(coordinates) {
  this.currentLocation = {
    type: 'Point',
    coordinates,
    updatedAt: new Date(),
  };
  this.locationHistory.push({
    coordinates,
    timestamp: new Date(),
  });
  await this.save();
  return this;
};

/**
 * Static method to find active emergencies
 */
emergencySchema.statics.findActive = function(hospitalId) {
  const query = {
    status: {
      $nin: ['completed', 'cancelled', 'rejected'],
    },
  };
  
  if (hospitalId) query.hospital = hospitalId;
  
  return this.find(query)
    .populate('requestedBy', 'name phone')
    .populate('hospital', 'name address')
    .sort({ priority: 1, requestedAt: 1 });
};

module.exports = mongoose.model('Emergency', emergencySchema);

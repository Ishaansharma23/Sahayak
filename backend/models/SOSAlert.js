const mongoose = require('mongoose');

/**
 * SOS Alert Schema
 * Women Safety Emergency Alert System
 */
const sosAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    required: true,
  },
  // User who triggered SOS
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Alert type
  type: {
    type: String,
    enum: ['sos', 'follow_me', 'unsafe_area', 'harassment', 'medical', 'other'],
    default: 'sos',
  },
  // Priority level
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'critical',
  },
  // Current location
  location: {
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
    accuracy: Number, // GPS accuracy in meters
  },
  // Location history (continuous tracking)
  locationHistory: [{
    coordinates: {
      type: [Number],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    accuracy: Number,
    speed: Number, // in m/s
    heading: Number, // direction in degrees
  }],
  // Status
  status: {
    type: String,
    enum: [
      'active',
      'acknowledged',
      'responding',
      'resolved',
      'false_alarm',
      'cancelled',
    ],
    default: 'active',
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  // Emergency contacts notified
  notifiedContacts: [{
    name: String,
    phone: String,
    relation: String,
    notifiedAt: { type: Date, default: Date.now },
    notificationStatus: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent',
    },
    response: String,
    respondedAt: Date,
  }],
  // Nearby hospitals alerted
  alertedHospitals: [{
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    distance: Number, // in km
    alertedAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: Date,
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  // Responders
  responders: [{
    type: { type: String, enum: ['police', 'hospital', 'emergency_contact', 'volunteer'] },
    name: String,
    phone: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],
    },
    assignedAt: { type: Date, default: Date.now },
    arrivedAt: Date,
    status: { type: String, enum: ['assigned', 'en_route', 'arrived', 'completed'] },
  }],
  // Additional info
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  audioRecording: {
    url: String,
    duration: Number, // seconds
    recordedAt: Date,
  },
  images: [{
    url: String,
    capturedAt: { type: Date, default: Date.now },
  }],
  // Timestamps
  triggeredAt: {
    type: Date,
    default: Date.now,
  },
  acknowledgedAt: Date,
  resolvedAt: Date,
  cancelledAt: Date,
  // Resolution details
  resolution: {
    type: { type: String, enum: ['safe', 'rescued', 'hospitalized', 'other'] },
    notes: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  // Tracking settings
  trackingInterval: {
    type: Number,
    default: 10, // seconds
  },
  isTracking: {
    type: Boolean,
    default: true,
  },
  lastTrackingUpdate: Date,
  // Battery status
  batteryLevel: Number, // percentage
  isCharging: Boolean,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
sosAlertSchema.index({ location: '2dsphere' });
sosAlertSchema.index({ user: 1 });
sosAlertSchema.index({ status: 1 });
sosAlertSchema.index({ triggeredAt: -1 });
sosAlertSchema.index({ priority: 1 });

/**
 * Pre-save middleware to generate alert ID
 */
sosAlertSchema.pre('save', async function(next) {
  if (!this.alertId) {
    const count = await this.constructor.countDocuments();
    this.alertId = `SOS-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

/**
 * Add location to history
 */
sosAlertSchema.methods.addLocation = async function(coordinates, accuracy, speed, heading) {
  this.location = {
    type: 'Point',
    coordinates,
    accuracy,
  };
  
  this.locationHistory.push({
    coordinates,
    timestamp: new Date(),
    accuracy,
    speed,
    heading,
  });
  
  this.lastTrackingUpdate = new Date();
  await this.save();
  return this;
};

/**
 * Update status
 */
sosAlertSchema.methods.updateStatus = async function(newStatus, userId, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy: userId,
  });

  switch (newStatus) {
    case 'acknowledged':
      this.acknowledgedAt = new Date();
      break;
    case 'resolved':
    case 'false_alarm':
      this.resolvedAt = new Date();
      this.isTracking = false;
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      this.isTracking = false;
      break;
  }

  await this.save();
  return this;
};

/**
 * Add responder
 */
sosAlertSchema.methods.addResponder = async function(responderData) {
  this.responders.push(responderData);
  await this.save();
  return this;
};

/**
 * Find nearby hospitals and alert them
 */
sosAlertSchema.methods.alertNearbyHospitals = async function(maxDistanceKm = 10) {
  const Hospital = mongoose.model('Hospital');
  
  const hospitals = await Hospital.findNearby(
    this.location.coordinates[1], // latitude
    this.location.coordinates[0], // longitude
    maxDistanceKm
  ).limit(5);

  for (const hospital of hospitals) {
    const distance = hospital.getDistanceFrom(
      this.location.coordinates[1],
      this.location.coordinates[0]
    );
    
    this.alertedHospitals.push({
      hospital: hospital._id,
      distance: Math.round(distance * 100) / 100,
      alertedAt: new Date(),
    });
  }

  await this.save();
  return this.alertedHospitals;
};

/**
 * Static method to find active alerts
 */
sosAlertSchema.statics.findActive = function() {
  return this.find({
    status: { $in: ['active', 'acknowledged', 'responding'] },
  })
  .populate('user', 'name phone emergencyContacts')
  .sort({ priority: 1, triggeredAt: -1 });
};

module.exports = mongoose.model('SOSAlert', sosAlertSchema);

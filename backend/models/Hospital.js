const mongoose = require('mongoose');

/**
 * Hospital Schema
 * Contains all hospital information including bed availability
 */
const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    maxlength: [200, 'Hospital name cannot exceed 200 characters'],
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
  },
  type: {
    type: String,
    enum: ['government', 'private', 'charitable', 'multi-specialty'],
    default: 'private',
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
    },
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: String,
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    emergencyPhone: {
      type: String,
      required: [true, 'Emergency phone is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
    },
    website: String,
  },
  // Bed Management
  beds: {
    total: {
      type: Number,
      required: [true, 'Total beds count is required'],
      min: [0, 'Beds cannot be negative'],
    },
    available: {
      type: Number,
      default: 0,
      min: [0, 'Available beds cannot be negative'],
    },
    icu: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    ventilators: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    emergency: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    general: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    pediatric: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    maternity: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
  },
  // Operating Hours
  operatingHours: {
    is24Hours: { type: Boolean, default: true },
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false },
    }],
  },
  // Facilities & Services
  facilities: [{
    type: String,
    enum: [
      'emergency', 'icu', 'operation_theater', 'laboratory',
      'pharmacy', 'radiology', 'blood_bank', 'dialysis',
      'physiotherapy', 'ambulance', 'parking', 'cafeteria',
      'wifi', 'atm', 'wheelchair', 'oxygen'
    ],
  }],
  specializations: [{
    type: String,
  }],
  // Ambulance details
  ambulances: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    types: [{
      type: { type: String, enum: ['basic', 'advanced', 'pediatric', 'neonatal'] },
      count: Number,
      available: Number,
    }],
  },
  // Associated doctors
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  }],
  // Admin user for this hospital
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Verification & Status
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  rejectionReason: String,
  // Documents
  documents: [{
    type: { type: String, enum: ['license', 'registration', 'accreditation', 'other'] },
    url: String,
    verified: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  }],
  // Images
  images: [{
    url: String,
    caption: String,
  }],
  logo: String,
  // Ratings
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  // Analytics
  stats: {
    totalEmergencies: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }, // in minutes
    monthlyPatients: { type: Number, default: 0 },
  },
  // Last bed update timestamp
  lastBedUpdate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for geospatial queries
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ 'address.city': 1 });
hospitalSchema.index({ verified: 1, isActive: 1 });
hospitalSchema.index({ 'beds.available': 1 });
hospitalSchema.index({ 'beds.icu.available': 1 });

/**
 * Virtual for full address
 */
hospitalSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
});

/**
 * Calculate distance from a point
 */
hospitalSchema.methods.getDistanceFrom = function(lat, lng) {
  const [hospitalLng, hospitalLat] = this.location.coordinates;
  const R = 6371; // Earth's radius in km
  
  const dLat = (hospitalLat - lat) * Math.PI / 180;
  const dLon = (hospitalLng - lng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(hospitalLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Static method to find nearby hospitals
 */
hospitalSchema.statics.findNearby = function(lat, lng, maxDistanceKm = 50) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistanceKm * 1000, // Convert to meters
      },
    },
    verified: true,
    isActive: true,
  });
};

/**
 * Update bed availability
 */
hospitalSchema.methods.updateBedAvailability = async function(bedType, available) {
  const validTypes = ['available', 'icu', 'ventilators', 'emergency', 'general', 'pediatric', 'maternity'];
  
  if (!validTypes.includes(bedType)) {
    throw new Error('Invalid bed type');
  }

  if (bedType === 'available') {
    this.beds.available = available;
  } else {
    this.beds[bedType].available = available;
  }
  
  this.lastBedUpdate = new Date();
  await this.save();
  
  return this;
};

module.exports = mongoose.model('Hospital', hospitalSchema);

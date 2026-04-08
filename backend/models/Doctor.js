const mongoose = require('mongoose');

/**
 * Doctor Schema
 * Contains doctor profile and availability information
 */
const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  registrationNumber: {
    type: String,
    required: [true, 'Medical registration number is required'],
    unique: true,
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    enum: [
      'general_medicine', 'cardiology', 'neurology', 'orthopedics',
      'pediatrics', 'gynecology', 'dermatology', 'psychiatry',
      'ophthalmology', 'ent', 'urology', 'nephrology',
      'gastroenterology', 'pulmonology', 'oncology', 'emergency_medicine',
      'anesthesiology', 'radiology', 'pathology', 'surgery',
      'plastic_surgery', 'dental', 'other'
    ],
  },
  subSpecializations: [String],
  qualifications: [{
    degree: { type: String, required: true },
    institution: String,
    year: Number,
  }],
  experience: {
    years: { type: Number, required: true, min: 0 },
    description: String,
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
  },
  // Multiple hospital affiliations
  affiliations: [{
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    position: String,
    primary: { type: Boolean, default: false },
  }],
  // Availability
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'offline', 'on_leave'],
    default: 'offline',
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    slots: [{
      startTime: String, // "09:00"
      endTime: String,   // "12:00"
      type: { type: String, enum: ['consultation', 'rounds', 'surgery', 'emergency'] },
    }],
    isAvailable: { type: Boolean, default: true },
  }],
  // Contact
  contact: {
    phone: String,
    email: String,
    emergencyPhone: String,
  },
  // Consultation
  consultation: {
    fee: {
      type: Number,
      required: true,
      min: [0, 'Fee cannot be negative'],
    },
    duration: {
      type: Number,
      default: 15, // minutes
    },
    onlineConsultation: {
      type: Boolean,
      default: false,
    },
    onlineFee: Number,
  },
  // Emergency availability
  emergencyAvailable: {
    type: Boolean,
    default: false,
  },
  currentlyOnDuty: {
    type: Boolean,
    default: false,
  },
  // Ratings
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  // Verification (kept but defaulted to true for simplified flow)
  verified: {
    type: Boolean,
    default: true,
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
    default: 'approved',
  },
  rejectionReason: String,
  // Documents
  documents: [{
    type: { type: String, enum: ['license', 'degree', 'id_proof', 'other'] },
    url: String,
    verified: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  }],
  certificateUrl: String,
  // Profile
  avatar: String,
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
  },
  languages: [String],
  // Statistics
  stats: {
    totalPatients: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },
    emergencyResponses: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ availabilityStatus: 1 });
doctorSchema.index({ verified: 1, isActive: 1 });
doctorSchema.index({ 'consultation.fee': 1 });

/**
 * Toggle availability status
 */
doctorSchema.methods.toggleAvailability = async function(status) {
  const validStatuses = ['available', 'busy', 'offline', 'on_leave'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }
  this.availabilityStatus = status;
  await this.save();
  return this;
};

/**
 * Check if doctor is available at a specific time
 */
doctorSchema.methods.isAvailableAt = function(dayOfWeek, time) {
  const schedule = this.schedule.find(s => s.day === dayOfWeek.toLowerCase());
  if (!schedule || !schedule.isAvailable) return false;
  
  return schedule.slots.some(slot => {
    return time >= slot.startTime && time <= slot.endTime;
  });
};

/**
 * Static method to find available doctors by specialization
 */
doctorSchema.statics.findAvailable = function(specialization, hospitalId) {
  const query = {
    isActive: true,
    availabilityStatus: 'available',
  };
  
  if (specialization) query.specialization = specialization;
  if (hospitalId) query.hospital = hospitalId;
  
  return this.find(query).populate('hospital', 'name address');
};

module.exports = mongoose.model('Doctor', doctorSchema);

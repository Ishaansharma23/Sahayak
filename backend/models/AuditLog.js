const mongoose = require('mongoose');

/**
 * Audit Log Schema
 * Tracks all important actions in the system for security and compliance
 */
const auditLogSchema = new mongoose.Schema({
  // Actor
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userEmail: String,
  userRole: String,
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // Auth actions
      'login', 'logout', 'register', 'password_reset', 'password_change',
      'email_verification', 'account_lock', 'account_unlock',
      // Hospital actions
      'hospital_create', 'hospital_update', 'hospital_delete',
      'hospital_verify', 'hospital_reject', 'hospital_suspend',
      'bed_update',
      // Doctor actions
      'doctor_create', 'doctor_update', 'doctor_delete',
      'doctor_verify', 'doctor_reject', 'availability_change',
      // Emergency actions
      'emergency_request', 'emergency_accept', 'emergency_dispatch',
      'emergency_complete', 'emergency_cancel', 'emergency_reject',
      // SOS actions
      'sos_trigger', 'sos_acknowledge', 'sos_respond', 'sos_resolve',
      'sos_false_alarm', 'sos_cancel',
      // Admin actions
      'admin_create', 'admin_update', 'admin_delete',
      'settings_change', 'role_change',
      // Data actions
      'data_export', 'data_import', 'data_delete',
      // Other
      'other',
    ],
  },
  category: {
    type: String,
    enum: ['auth', 'hospital', 'doctor', 'emergency', 'sos', 'admin', 'data', 'system'],
    required: true,
  },
  // Resource affected
  resource: {
    type: { type: String }, // 'User', 'Hospital', 'Doctor', etc.
    id: mongoose.Schema.Types.ObjectId,
    name: String,
  },
  // Details
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  // Request info
  ipAddress: String,
  userAgent: String,
  requestMethod: String,
  requestUrl: String,
  // Status
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
  },
  errorMessage: String,
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false, // We use our own timestamp
});

// Indexes
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });

// TTL index - automatically delete logs older than 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

/**
 * Static method to create audit log
 */
auditLogSchema.statics.log = async function(data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Audit log error:', error.message);
    // Don't throw - logging should not break the main flow
  }
};

/**
 * Static method to get user activity
 */
auditLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const { limit = 50, offset = 0, startDate, endDate } = options;
  
  const query = { user: userId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit);
};

/**
 * Static method to get resource history
 */
auditLogSchema.statics.getResourceHistory = function(resourceType, resourceId) {
  return this.find({
    'resource.type': resourceType,
    'resource.id': resourceId,
  })
  .populate('user', 'name email')
  .sort({ timestamp: -1 });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);

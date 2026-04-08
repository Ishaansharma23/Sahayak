const Joi = require('joi');

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join('. ');
      return res.status(400).json({
        success: false,
        message: messages,
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    // Replace body with validated value
    req.body = value;
    next();
  };
};

/**
 * Common validation patterns
 */
const patterns = {
  phone: /^\+?[\d\s-]{10,15}$/,
  objectId: /^[0-9a-fA-F]{24}$/,
};

// ==================== AUTH VALIDATORS ====================

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.empty': 'Name is required' }),
  email: Joi.string().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email' }),
  phone: Joi.string().pattern(patterns.phone).required()
    .messages({ 'string.pattern.base': 'Please provide a valid phone number' }),
  password: Joi.string().min(6).max(128).required()
    .messages({ 'string.min': 'Password must be at least 6 characters' }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
  accountType: Joi.string().valid('client', 'doctor', 'hospital', 'admin').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({ 'string.email': 'Please provide a valid email' }),
  password: Joi.string().required()
    .messages({ 'string.empty': 'Password is required' }),
  accountType: Joi.string().valid('client', 'doctor', 'hospital', 'admin').optional(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().pattern(patterns.phone),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    country: Joi.string(),
  }),
  emergencyContacts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().pattern(patterns.phone).required(),
      relation: Joi.string(),
    })
  ).max(5),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

// ==================== ONBOARDING VALIDATORS ====================

const profileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().pattern(patterns.phone),
  avatar: Joi.string().uri(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('India'),
  }).required(),
  emergencyContacts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().pattern(patterns.phone).required(),
      relation: Joi.string().allow(''),
    })
  ).max(5),
});

const doctorOnboardingSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  registrationNumber: Joi.string().required(),
  specialization: Joi.string().required(),
  subSpecializations: Joi.array().items(Joi.string()),
  qualifications: Joi.array().items(
    Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string().allow(''),
      year: Joi.number().min(1950).max(new Date().getFullYear()),
    })
  ).min(1).required(),
  experienceYears: Joi.number().min(0).required(),
  experienceDescription: Joi.string().allow(''),
  consultationFee: Joi.number().min(0).required(),
  consultationDuration: Joi.number().min(5).max(120),
  onlineConsultation: Joi.boolean(),
  onlineFee: Joi.number().min(0),
  languages: Joi.array().items(Joi.string()).min(1).required(),
  bio: Joi.string().max(1000).allow(''),
  contact: Joi.object({
    phone: Joi.string().pattern(patterns.phone),
    email: Joi.string().email(),
    emergencyPhone: Joi.string().pattern(patterns.phone),
  }),
  certificateUrl: Joi.string().uri().required(),
  hospitalId: Joi.string().pattern(patterns.objectId),
});

const hospitalOnboardingSchema = Joi.object({
  name: Joi.string().trim().min(3).max(200).required(),
  registrationNumber: Joi.string().required(),
  type: Joi.string().valid('government', 'private', 'charitable', 'multi-specialty'),
  description: Joi.string().max(2000).allow(''),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('India'),
    landmark: Joi.string().allow(''),
  }).required(),
  contact: Joi.object({
    phone: Joi.string().pattern(patterns.phone).required(),
    emergencyPhone: Joi.string().pattern(patterns.phone).required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri(),
  }).required(),
  beds: Joi.object({
    total: Joi.number().min(0).required(),
    available: Joi.number().min(0),
    icu: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    ventilators: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    emergency: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    general: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    pediatric: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    maternity: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
  }).required(),
  ambulances: Joi.object({
    total: Joi.number().min(0),
    available: Joi.number().min(0),
  }),
  facilities: Joi.array().items(Joi.string()),
  specializations: Joi.array().items(Joi.string()),
  certificateUrl: Joi.string().uri().required(),
});

const onboardingSchema = Joi.object({
  accountType: Joi.string().valid('client', 'doctor', 'hospital', 'admin').required(),
  profile: profileSchema.required(),
  doctorProfile: Joi.when('accountType', {
    is: 'doctor',
    then: doctorOnboardingSchema.required(),
    otherwise: Joi.forbidden(),
  }),
  hospitalProfile: Joi.when('accountType', {
    is: 'hospital',
    then: hospitalOnboardingSchema.required(),
    otherwise: Joi.forbidden(),
  }),
});

// ==================== HOSPITAL VALIDATORS ====================

const hospitalSchema = Joi.object({
  name: Joi.string().trim().min(3).max(200).required(),
  registrationNumber: Joi.string().required(),
  type: Joi.string().valid('government', 'private', 'charitable', 'multi-specialty'),
  description: Joi.string().max(2000),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('India'),
    landmark: Joi.string(),
  }).required(),
  contact: Joi.object({
    phone: Joi.string().pattern(patterns.phone).required(),
    emergencyPhone: Joi.string().pattern(patterns.phone).required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri(),
  }).required(),
  beds: Joi.object({
    total: Joi.number().min(0).required(),
    available: Joi.number().min(0),
    icu: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    ventilators: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    emergency: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    general: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    pediatric: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    maternity: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
    surgical: Joi.object({
      total: Joi.number().min(0),
      available: Joi.number().min(0),
    }),
  }).required(),
  facilities: Joi.array().items(Joi.string()),
  specializations: Joi.array().items(Joi.string()),
  ambulances: Joi.object({
    total: Joi.number().min(0),
    available: Joi.number().min(0),
  }),
});

const updateBedSchema = Joi.object({
  bedType: Joi.string()
    .valid('available', 'icu', 'ventilators', 'emergency', 'general', 'pediatric', 'maternity', 'surgical')
    .required(),
  available: Joi.number().min(0).required(),
});

// ==================== DOCTOR VALIDATORS ====================

const doctorSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  registrationNumber: Joi.string().required(),
  specialization: Joi.string().required(),
  subSpecializations: Joi.array().items(Joi.string()),
  qualifications: Joi.array().items(
    Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string(),
      year: Joi.number().min(1950).max(new Date().getFullYear()),
    })
  ).min(1).required(),
  experience: Joi.object({
    years: Joi.number().min(0).required(),
    description: Joi.string(),
  }).required(),
  hospitalId: Joi.string().pattern(patterns.objectId),
  contact: Joi.object({
    phone: Joi.string().pattern(patterns.phone),
    email: Joi.string().email(),
    emergencyPhone: Joi.string().pattern(patterns.phone),
  }),
  consultation: Joi.object({
    fee: Joi.number().min(0).required(),
    duration: Joi.number().min(5).max(120),
    onlineConsultation: Joi.boolean(),
    onlineFee: Joi.number().min(0),
  }).required(),
  bio: Joi.string().max(1000),
  languages: Joi.array().items(Joi.string()),
});

const updateAvailabilitySchema = Joi.object({
  status: Joi.string()
    .valid('available', 'busy', 'offline', 'on_leave')
    .required(),
});

// ==================== EMERGENCY VALIDATORS ====================

const emergencyRequestSchema = Joi.object({
  type: Joi.string()
    .valid('ambulance', 'emergency_bed', 'doctor_visit', 'blood', 'oxygen', 'other')
    .required(),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low').default('high'),
  patientInfo: Joi.object({
    name: Joi.string().required(),
    age: Joi.number().min(0).max(150),
    gender: Joi.string().valid('male', 'female', 'other'),
    phone: Joi.string().pattern(patterns.phone),
    condition: Joi.string(),
    medicalHistory: Joi.string(),
    currentMedications: Joi.string(),
    allergies: Joi.string(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'unknown'),
  }).required(),
  pickupLocation: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string(),
    landmark: Joi.string(),
  }).required(),
  hospitalId: Joi.string().pattern(patterns.objectId),
  notes: Joi.string().max(500),
});

// ==================== SOS VALIDATORS ====================

const sosAlertSchema = Joi.object({
  type: Joi.string()
    .valid('sos', 'follow_me', 'unsafe_area', 'harassment', 'medical', 'other')
    .default('sos'),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string(),
    accuracy: Joi.number(),
  }).required(),
  description: Joi.string().max(1000),
  contactName: Joi.string().max(100),
  contactPhone: Joi.string().pattern(patterns.phone),
  batteryLevel: Joi.number().min(0).max(100),
  isCharging: Joi.boolean(),
});

const locationUpdateSchema = Joi.object({
  coordinates: Joi.array().items(Joi.number()).length(2).required(),
  accuracy: Joi.number(),
  speed: Joi.number(),
  heading: Joi.number(),
});

module.exports = {
  validate,
  authValidators: {
    register: validate(registerSchema),
    login: validate(loginSchema),
    updateProfile: validate(updateProfileSchema),
    changePassword: validate(changePasswordSchema),
    onboarding: validate(onboardingSchema),
  },
  hospitalValidators: {
    create: validate(hospitalSchema),
    update: validate(hospitalSchema.fork(
      ['name', 'registrationNumber', 'location', 'address', 'contact', 'beds'],
      (schema) => schema.optional()
    )),
    updateBed: validate(updateBedSchema),
  },
  doctorValidators: {
    create: validate(doctorSchema),
    update: validate(doctorSchema.fork(
      ['name', 'registrationNumber', 'specialization', 'qualifications', 'experience', 'consultation'],
      (schema) => schema.optional()
    )),
    updateAvailability: validate(updateAvailabilitySchema),
  },
  emergencyValidators: {
    create: validate(emergencyRequestSchema),
  },
  sosValidators: {
    create: validate(sosAlertSchema),
    locationUpdate: validate(locationUpdateSchema),
  },
};

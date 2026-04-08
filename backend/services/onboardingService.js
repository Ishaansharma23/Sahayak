const { User, Doctor, Hospital } = require('../models');
const { ErrorResponse } = require('../middleware/errorHandler');

const normalizeAccountType = (accountType) => {
  if (!accountType) return undefined;
  const value = String(accountType).toLowerCase();
  const map = {
    user: 'client',
    client: 'client',
    doctor: 'doctor',
    hospital: 'hospital',
    hospital_admin: 'hospital',
    admin: 'admin',
    super_admin: 'admin',
  };
  return map[value];
};

const applyProfileUpdates = (user, profile) => {
  if (!profile) return;
  const allowed = ['name', 'phone', 'address', 'emergencyContacts', 'avatar'];
  allowed.forEach((field) => {
    if (profile[field] !== undefined) {
      user[field] = profile[field];
    }
  });
};

const upsertDoctorProfile = async (user, doctorProfile) => {
  if (!doctorProfile) {
    throw new ErrorResponse('Doctor profile is required for onboarding', 400);
  }

  const payload = {
    user: user._id,
    name: doctorProfile.name || user.name,
    registrationNumber: doctorProfile.registrationNumber,
    specialization: doctorProfile.specialization,
    subSpecializations: doctorProfile.subSpecializations || [],
    qualifications: doctorProfile.qualifications,
    experience: {
      years: doctorProfile.experienceYears,
      description: doctorProfile.experienceDescription,
    },
    consultation: {
      fee: doctorProfile.consultationFee,
      duration: doctorProfile.consultationDuration,
      onlineConsultation: doctorProfile.onlineConsultation,
      onlineFee: doctorProfile.onlineFee,
    },
    contact: doctorProfile.contact,
    bio: doctorProfile.bio,
    languages: doctorProfile.languages || [],
    certificateUrl: doctorProfile.certificateUrl,
  };

  if (doctorProfile.hospitalId) {
    payload.hospital = doctorProfile.hospitalId;
  }

  const existing = user.doctorProfile
    ? await Doctor.findById(user.doctorProfile)
    : await Doctor.findOne({ user: user._id });

  if (existing) {
    const updated = await Doctor.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true,
    });
    user.doctorProfile = updated._id;
    return updated;
  }

  const created = await Doctor.create(payload);
  user.doctorProfile = created._id;
  return created;
};

const upsertHospitalProfile = async (user, hospitalProfile) => {
  if (!hospitalProfile) {
    throw new ErrorResponse('Hospital profile is required for onboarding', 400);
  }

  const payload = {
    name: hospitalProfile.name,
    registrationNumber: hospitalProfile.registrationNumber,
    type: hospitalProfile.type,
    description: hospitalProfile.description,
    location: hospitalProfile.location,
    address: hospitalProfile.address,
    contact: hospitalProfile.contact,
    beds: {
      ...hospitalProfile.beds,
      available: hospitalProfile.beds?.available ?? hospitalProfile.beds?.total,
    },
    ambulances: hospitalProfile.ambulances,
    facilities: hospitalProfile.facilities || [],
    specializations: hospitalProfile.specializations || [],
    certificateUrl: hospitalProfile.certificateUrl,
    admin: user._id,
  };

  const hospitalId = user.hospitalProfile || user.hospital;
  const existing = hospitalId ? await Hospital.findById(hospitalId) : null;

  if (existing) {
    const updated = await Hospital.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true,
    });
    user.hospitalProfile = updated._id;
    user.hospital = updated._id;
    return updated;
  }

  const created = await Hospital.create(payload);
  user.hospitalProfile = created._id;
  user.hospital = created._id;
  return created;
};

const completeOnboarding = async (userId, payload) => {
  const user = await User.findById(userId).select('+role');
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const accountType = normalizeAccountType(payload.accountType || user.accountType || user.role);
  if (!accountType) {
    throw new ErrorResponse('Account type is required', 400);
  }

  if (user.accountType && user.accountType !== accountType) {
    throw new ErrorResponse('Account type mismatch', 400);
  }

  user.accountType = accountType;
  applyProfileUpdates(user, payload.profile);

  let doctorProfile = null;
  let hospitalProfile = null;

  if (accountType === 'doctor') {
    doctorProfile = await upsertDoctorProfile(user, payload.doctorProfile);
  }

  if (accountType === 'hospital') {
    hospitalProfile = await upsertHospitalProfile(user, payload.hospitalProfile);
  }

  user.isOnboarded = true;
  await user.save();

  return {
    user,
    doctorProfile,
    hospitalProfile,
  };
};

module.exports = {
  completeOnboarding,
  normalizeAccountType,
};

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiClipboardCheck, HiLocationMarker, HiUpload } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { uploadFile } from '../../services/imagekit';
import { getDashboardPath, normalizeAccountType } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const emptyAddress = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
};

const emptyEmergencyContact = {
  name: '',
  phone: '',
  relation: '',
};

const Onboarding = () => {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [accountType, setAccountType] = useState('client');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ doctor: false, hospital: false });

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: emptyAddress,
    emergencyContact: emptyEmergencyContact,
  });

  const [doctorProfile, setDoctorProfile] = useState({
    name: user?.name || '',
    registrationNumber: '',
    specialization: '',
    experienceYears: '',
    experienceDescription: '',
    qualifications: [{ degree: '', institution: '', year: '' }],
    consultationFee: '',
    consultationDuration: '',
    onlineConsultation: false,
    onlineFee: '',
    languages: '',
    bio: '',
    contact: {
      phone: user?.phone || '',
      email: user?.email || '',
      emergencyPhone: '',
    },
    certificateUrl: '',
  });

  const [hospitalProfile, setHospitalProfile] = useState({
    name: '',
    registrationNumber: '',
    type: 'private',
    description: '',
    location: { lat: '', lng: '' },
    address: emptyAddress,
    contact: {
      phone: '',
      emergencyPhone: '',
      email: user?.email || '',
      website: '',
    },
    beds: {
      total: '',
      available: '',
      icu: { total: '', available: '' },
      ventilators: { total: '', available: '' },
    },
    ambulances: {
      total: '',
      available: '',
    },
    certificateUrl: '',
  });

  useEffect(() => {
    const fromQuery = normalizeAccountType(searchParams.get('type'));
    const fromUser = normalizeAccountType(user?.accountType);
    setAccountType(fromQuery || fromUser || 'client');
  }, [searchParams, user?.accountType]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHospitalProfile((prev) => ({
          ...prev,
          location: {
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
          },
        }));
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  const parsedLanguages = useMemo(() => {
    return doctorProfile.languages
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [doctorProfile.languages]);

  const handleUpload = async (file, target) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [target]: true }));

    try {
      const category = target === 'doctor' ? 'doctors' : 'hospitals';
      const uploaded = await uploadFile({ file, category });
      const uploadedUrl = uploaded?.data?.url;

      if (!uploadedUrl) {
        throw new Error('Upload failed');
      }

      if (target === 'doctor') {
        setDoctorProfile((prev) => ({
          ...prev,
          certificateUrl: uploadedUrl,
        }));
      }

      if (target === 'hospital') {
        setHospitalProfile((prev) => ({
          ...prev,
          certificateUrl: uploadedUrl,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, [target]: false }));
    }
  };

  const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const baseProfileReady =
    profile.name &&
    profile.phone &&
    profile.address.street &&
    profile.address.city &&
    profile.address.state &&
    profile.address.zipCode;

  const doctorReady =
    doctorProfile.registrationNumber &&
    doctorProfile.specialization &&
    doctorProfile.experienceYears &&
    doctorProfile.consultationFee &&
    doctorProfile.qualifications[0]?.degree &&
    parsedLanguages.length > 0 &&
    doctorProfile.certificateUrl;

  const hospitalReady =
    hospitalProfile.name &&
    hospitalProfile.registrationNumber &&
    hospitalProfile.location.lat &&
    hospitalProfile.location.lng &&
    hospitalProfile.address.street &&
    hospitalProfile.address.city &&
    hospitalProfile.address.state &&
    hospitalProfile.address.zipCode &&
    hospitalProfile.contact.phone &&
    hospitalProfile.contact.emergencyPhone &&
    hospitalProfile.contact.email &&
    hospitalProfile.beds.total &&
    hospitalProfile.certificateUrl;

  const canSubmit = baseProfileReady &&
    (accountType === 'doctor'
      ? doctorReady
      : accountType === 'hospital'
      ? hospitalReady
      : true);

  const handleSubmit = async () => {
    const payload = {
      accountType,
      profile: {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        emergencyContacts: profile.emergencyContact.name && profile.emergencyContact.phone
          ? [profile.emergencyContact]
          : [],
      },
    };

    if (accountType === 'doctor') {
      payload.doctorProfile = {
        name: doctorProfile.name || profile.name,
        registrationNumber: doctorProfile.registrationNumber,
        specialization: doctorProfile.specialization,
        qualifications: doctorProfile.qualifications.map((qual) => ({
          ...qual,
          year: toNumber(qual.year),
        })),
        experienceYears: toNumber(doctorProfile.experienceYears),
        experienceDescription: doctorProfile.experienceDescription,
        consultationFee: toNumber(doctorProfile.consultationFee),
        consultationDuration: toNumber(doctorProfile.consultationDuration),
        onlineConsultation: doctorProfile.onlineConsultation,
        onlineFee: toNumber(doctorProfile.onlineFee),
        languages: parsedLanguages,
        bio: doctorProfile.bio,
        contact: doctorProfile.contact,
        certificateUrl: doctorProfile.certificateUrl,
      };
    }

    if (accountType === 'hospital') {
      payload.hospitalProfile = {
        name: hospitalProfile.name,
        registrationNumber: hospitalProfile.registrationNumber,
        type: hospitalProfile.type,
        description: hospitalProfile.description,
        location: {
          coordinates: [
            toNumber(hospitalProfile.location.lng),
            toNumber(hospitalProfile.location.lat),
          ],
        },
        address: hospitalProfile.address,
        contact: hospitalProfile.contact,
        beds: {
          total: toNumber(hospitalProfile.beds.total),
          available: toNumber(hospitalProfile.beds.available) ?? toNumber(hospitalProfile.beds.total),
          icu: {
            total: toNumber(hospitalProfile.beds.icu.total),
            available: toNumber(hospitalProfile.beds.icu.available) ?? toNumber(hospitalProfile.beds.icu.total),
          },
          ventilators: {
            total: toNumber(hospitalProfile.beds.ventilators.total),
            available: toNumber(hospitalProfile.beds.ventilators.available) ?? toNumber(hospitalProfile.beds.ventilators.total),
          },
        },
        ambulances: {
          total: toNumber(hospitalProfile.ambulances.total),
          available: toNumber(hospitalProfile.ambulances.available) ?? toNumber(hospitalProfile.ambulances.total),
        },
        certificateUrl: hospitalProfile.certificateUrl,
      };
    }

    setLoading(true);
    const result = await completeOnboarding(payload);
    setLoading(false);

    if (result.success) {
      navigate(getDashboardPath(result.user?.accountType), { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-semibold"
          >
            Complete your onboarding
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 mt-2"
          >
            Help us personalize your dashboard for a {accountType} account.
          </motion.p>
        </div>

        <Card className="bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <HiClipboardCheck className="w-5 h-5" />
            <span>Account type locked to: <span className="text-white font-semibold">{accountType}</span></span>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Personal Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                label="Phone"
                value={profile.phone}
                onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Street Address"
                value={profile.address.street}
                onChange={(e) => setProfile((prev) => ({
                  ...prev,
                  address: { ...prev.address, street: e.target.value },
                }))}
                required
              />
              <Input
                label="City"
                value={profile.address.city}
                onChange={(e) => setProfile((prev) => ({
                  ...prev,
                  address: { ...prev.address, city: e.target.value },
                }))}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Input
                label="State"
                value={profile.address.state}
                onChange={(e) => setProfile((prev) => ({
                  ...prev,
                  address: { ...prev.address, state: e.target.value },
                }))}
                required
              />
              <Input
                label="Zip Code"
                value={profile.address.zipCode}
                onChange={(e) => setProfile((prev) => ({
                  ...prev,
                  address: { ...prev.address, zipCode: e.target.value },
                }))}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Emergency Contact"
                value={profile.emergencyContact.name}
                onChange={(e) => setProfile((prev) => ({
                  ...prev,
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value },
                }))}
              />
              <Input
                label="Emergency Phone"
                value={profile.emergencyContact.phone}
                onChange={(e) => setProfile((prev) => ({
                  ...prev,
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value },
                }))}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Relation"
                value={profile.emergencyContact.relation}
                onChange={(e) => setProfile((prev) => ({
                  ...prev,
                  emergencyContact: { ...prev.emergencyContact, relation: e.target.value },
                }))}
              />
            </div>
          </Card>

          {accountType === 'doctor' && (
            <Card className="bg-white/5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Doctor Profile</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Medical Registration Number"
                  value={doctorProfile.registrationNumber}
                  onChange={(e) => setDoctorProfile((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                  required
                />
                <Input
                  label="Specialization"
                  value={doctorProfile.specialization}
                  onChange={(e) => setDoctorProfile((prev) => ({ ...prev, specialization: e.target.value }))}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Experience (years)"
                  type="number"
                  value={doctorProfile.experienceYears}
                  onChange={(e) => setDoctorProfile((prev) => ({ ...prev, experienceYears: e.target.value }))}
                  required
                />
                <Input
                  label="Consultation Fee"
                  type="number"
                  value={doctorProfile.consultationFee}
                  onChange={(e) => setDoctorProfile((prev) => ({ ...prev, consultationFee: e.target.value }))}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Qualification (Degree)"
                  value={doctorProfile.qualifications[0].degree}
                  onChange={(e) => setDoctorProfile((prev) => ({
                    ...prev,
                    qualifications: [{ ...prev.qualifications[0], degree: e.target.value }],
                  }))}
                  required
                />
                <Input
                  label="Institution"
                  value={doctorProfile.qualifications[0].institution}
                  onChange={(e) => setDoctorProfile((prev) => ({
                    ...prev,
                    qualifications: [{ ...prev.qualifications[0], institution: e.target.value }],
                  }))}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Qualification Year"
                  type="number"
                  value={doctorProfile.qualifications[0].year}
                  onChange={(e) => setDoctorProfile((prev) => ({
                    ...prev,
                    qualifications: [{ ...prev.qualifications[0], year: e.target.value }],
                  }))}
                />
                <Input
                  label="Languages (comma-separated)"
                  value={doctorProfile.languages}
                  onChange={(e) => setDoctorProfile((prev) => ({ ...prev, languages: e.target.value }))}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Contact Phone"
                  value={doctorProfile.contact.phone}
                  onChange={(e) => setDoctorProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value },
                  }))}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={doctorProfile.contact.email}
                  onChange={(e) => setDoctorProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value },
                  }))}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Bio"
                  value={doctorProfile.bio}
                  onChange={(e) => setDoctorProfile((prev) => ({ ...prev, bio: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <HiUpload className="w-4 h-4" />
                  Proof of Education
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'doctor')}
                />
                {uploading.doctor && <span className="text-xs text-gray-400">Uploading...</span>}
              </div>
            </Card>
          )}

          {accountType === 'hospital' && (
            <Card className="bg-white/5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Hospital Profile</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Hospital Name"
                  value={hospitalProfile.name}
                  onChange={(e) => setHospitalProfile((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Registration Number"
                  value={hospitalProfile.registrationNumber}
                  onChange={(e) => setHospitalProfile((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Contact Phone"
                  value={hospitalProfile.contact.phone}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value },
                  }))}
                  required
                />
                <Input
                  label="Emergency Phone"
                  value={hospitalProfile.contact.emergencyPhone}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, emergencyPhone: e.target.value },
                  }))}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Email"
                  type="email"
                  value={hospitalProfile.contact.email}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value },
                  }))}
                  required
                />
                <Input
                  label="Website"
                  value={hospitalProfile.contact.website}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, website: e.target.value },
                  }))}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Street Address"
                  value={hospitalProfile.address.street}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value },
                  }))}
                  required
                />
                <Input
                  label="City"
                  value={hospitalProfile.address.city}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="State"
                  value={hospitalProfile.address.state}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value },
                  }))}
                  required
                />
                <Input
                  label="Zip Code"
                  value={hospitalProfile.address.zipCode}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, zipCode: e.target.value },
                  }))}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Latitude"
                  value={hospitalProfile.location.lat}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    location: { ...prev.location, lat: e.target.value },
                  }))}
                  required
                />
                <Input
                  label="Longitude"
                  value={hospitalProfile.location.lng}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    location: { ...prev.location, lng: e.target.value },
                  }))}
                  required
                  icon={HiLocationMarker}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Total Beds"
                  type="number"
                  value={hospitalProfile.beds.total}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    beds: { ...prev.beds, total: e.target.value },
                  }))}
                  required
                />
                <Input
                  label="Available Beds"
                  type="number"
                  value={hospitalProfile.beds.available}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    beds: { ...prev.beds, available: e.target.value },
                  }))}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="ICU Total"
                  type="number"
                  value={hospitalProfile.beds.icu.total}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    beds: {
                      ...prev.beds,
                      icu: { ...prev.beds.icu, total: e.target.value },
                    },
                  }))}
                />
                <Input
                  label="ICU Available"
                  type="number"
                  value={hospitalProfile.beds.icu.available}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    beds: {
                      ...prev.beds,
                      icu: { ...prev.beds.icu, available: e.target.value },
                    },
                  }))}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Ventilators Total"
                  type="number"
                  value={hospitalProfile.beds.ventilators.total}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    beds: {
                      ...prev.beds,
                      ventilators: { ...prev.beds.ventilators, total: e.target.value },
                    },
                  }))}
                />
                <Input
                  label="Ventilators Available"
                  type="number"
                  value={hospitalProfile.beds.ventilators.available}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    beds: {
                      ...prev.beds,
                      ventilators: { ...prev.beds.ventilators, available: e.target.value },
                    },
                  }))}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Ambulances Total"
                  type="number"
                  value={hospitalProfile.ambulances.total}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    ambulances: { ...prev.ambulances, total: e.target.value },
                  }))}
                />
                <Input
                  label="Ambulances Available"
                  type="number"
                  value={hospitalProfile.ambulances.available}
                  onChange={(e) => setHospitalProfile((prev) => ({
                    ...prev,
                    ambulances: { ...prev.ambulances, available: e.target.value },
                  }))}
                />
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <HiUpload className="w-4 h-4" />
                  Hospital Documents
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'hospital')}
                />
                {uploading.hospital && <span className="text-xs text-gray-400">Uploading...</span>}
              </div>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-cyan-400"
            onClick={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          >
            Finish onboarding
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

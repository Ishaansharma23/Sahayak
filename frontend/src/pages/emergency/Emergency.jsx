import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiPhone,
  HiLocationMarker,
  HiTruck,
  HiOfficeBuilding,
  HiExclamation,
  HiCheck,
} from 'react-icons/hi';
import { emergencyAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const Emergency = () => {
  const navigate = useNavigate();
  const { emitEmergencyUpdate, isConnected } = useSocket();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [formData, setFormData] = useState({
    type: 'medical',
    patientName: '',
    patientAge: '',
    patientCondition: '',
    contactPhone: '',
    notes: '',
  });

  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: '🏥', color: 'bg-red-500' },
    { id: 'accident', label: 'Accident', icon: '🚗', color: 'bg-orange-500' },
    { id: 'cardiac', label: 'Cardiac Emergency', icon: '❤️', color: 'bg-pink-500' },
    { id: 'trauma', label: 'Trauma', icon: '🩹', color: 'bg-purple-500' },
    { id: 'pregnancy', label: 'Pregnancy Emergency', icon: '🤰', color: 'bg-blue-500' },
    { id: 'other', label: 'Other', icon: '⚕️', color: 'bg-gray-500' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyHospitals();
    }
  }, [location]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast.error('Please enable location for emergency services');
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const fetchNearbyHospitals = async () => {
    try {
      const response = await hospitalAPI.getNearby({
        lat: location.lat,
        lng: location.lng,
        radius: 20,
        limit: 5,
      });
      if (response.data.success) {
        setNearbyHospitals(response.data.hospitals || []);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!location) {
      toast.error('Location is required for emergency request');
      return;
    }

    if (!formData.contactPhone) {
      toast.error('Please provide a contact phone number');
      return;
    }

    setLoading(true);
    try {
      const emergencyData = {
        type: formData.type,
        patient: {
          name: formData.patientName,
          age: formData.patientAge ? parseInt(formData.patientAge) : undefined,
          condition: formData.patientCondition,
        },
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
        contactPhone: formData.contactPhone,
        notes: formData.notes,
        hospital: selectedHospital?._id,
      };

      // Emit via socket
      if (isConnected) {
        emitEmergencyUpdate(emergencyData);
      }

      const response = await emergencyAPI.create(emergencyData);

      if (response.data.success) {
        toast.success('Emergency request sent! Ambulance is being dispatched.');
        navigate(`/emergency/${response.data.emergency._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send emergency request');
      console.error('Emergency error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                What type of emergency?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select the type of emergency for faster response
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {emergencyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, type: type.id }));
                    setStep(2);
                  }}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-left
                    ${formData.type === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-3xl mb-2 block">{type.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Patient Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Provide details for medical team
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Patient Name"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                placeholder="Enter patient name"
              />

              <Input
                label="Patient Age"
                name="patientAge"
                type="number"
                value={formData.patientAge}
                onChange={handleChange}
                placeholder="Enter age"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condition/Symptoms
                </label>
                <textarea
                  name="patientCondition"
                  value={formData.patientCondition}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Describe the condition or symptoms..."
                />
              </div>

              <Input
                label="Contact Phone"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="Enter contact number"
                required
                icon={HiPhone}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button fullWidth onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Select Hospital
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose preferred hospital or let us decide
              </p>
            </div>

            {/* Location Status */}
            <Card className={location ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}>
              <div className="flex items-center gap-3">
                <HiLocationMarker className={`w-6 h-6 ${location ? 'text-green-500' : 'text-yellow-500'}`} />
                <div className="flex-1">
                  <p className={`font-medium ${location ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                    {location ? 'Location Detected' : 'Getting Location...'}
                  </p>
                  {location && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Hospital Selection */}
            <div className="space-y-3">
              <button
                onClick={() => setSelectedHospital(null)}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4
                  ${!selectedHospital
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <HiTruck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Nearest Available Hospital
                  </p>
                  <p className="text-sm text-gray-500">
                    We'll dispatch to the nearest hospital with availability
                  </p>
                </div>
                {!selectedHospital && (
                  <HiCheck className="w-6 h-6 text-primary ml-auto" />
                )}
              </button>

              {nearbyHospitals.map((hospital) => (
                <button
                  key={hospital._id}
                  onClick={() => setSelectedHospital(hospital)}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4
                    ${selectedHospital?._id === hospital._id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <HiOfficeBuilding className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {hospital.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {hospital.distance?.toFixed(1) || '?'} km away • {hospital.beds?.available || 0} beds
                    </p>
                  </div>
                  {selectedHospital?._id === hospital._id && (
                    <HiCheck className="w-6 h-6 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button fullWidth onClick={() => setStep(4)}>
                Continue
              </Button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Confirm Request
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review and confirm your emergency request
              </p>
            </div>

            {/* Summary */}
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Request Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Emergency Type</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {formData.type}
                  </span>
                </div>
                {formData.patientName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Patient</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.patientName} {formData.patientAge ? `(${formData.patientAge} yrs)` : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.contactPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hospital</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedHospital?.name || 'Nearest Available'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Warning */}
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <HiExclamation className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    Important
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    Only submit real emergencies. False requests may result in legal action.
                  </p>
                </div>
              </div>
            </Card>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Any additional information for the ambulance team..."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="danger"
                fullWidth
                icon={HiTruck}
                onClick={handleSubmit}
                loading={loading}
              >
                Request Ambulance
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${step >= s
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }
              `}
            >
              {step > s ? <HiCheck className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`
                  w-16 lg:w-24 h-1 mx-2
                  ${step > s ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {renderStep()}
      </Card>

      {/* Emergency Numbers */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 mb-2">For immediate help, call:</p>
        <div className="flex justify-center gap-4">
          <a
            href="tel:102"
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <HiPhone className="w-4 h-4" />
            Ambulance: 102
          </a>
          <a
            href="tel:108"
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <HiPhone className="w-4 h-4" />
            Emergency: 108
          </a>
        </div>
      </div>
    </div>
  );
};

export default Emergency;

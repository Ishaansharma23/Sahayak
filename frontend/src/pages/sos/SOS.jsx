import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiShieldExclamation,
  HiLocationMarker,
  HiPhone,
  HiUsers,
  HiX,
  HiCheck,
  HiExclamation,
} from 'react-icons/hi';
import { sosAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const SOS = () => {
  const { user } = useAuth();
  const { emitSOS, isConnected } = useSocket();
  const [sosActive, setSosActive] = useState(false);
  const [activeSOS, setActiveSOS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [countdownActive, setCountdownActive] = useState(false);

  // Emergency contacts (in real app, these would come from user profile)
  const emergencyContacts = user?.emergencyContacts || [
    { name: 'Police', phone: '100', type: 'emergency' },
    { name: 'Women Helpline', phone: '181', type: 'emergency' },
    { name: 'Ambulance', phone: '102', type: 'emergency' },
  ];

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable GPS.');
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
    checkActiveAlerts();
  }, [getCurrentLocation]);

  // Check for active SOS alerts
  const checkActiveAlerts = async () => {
    try {
      const response = await sosAPI.getMy();
      if (response.data.success) {
        const active = response.data.alerts?.find(
          (a) => a.status === 'active' || a.status === 'responded'
        );
        if (active) {
          setActiveSOS(active);
          setSosActive(true);
        }
      }
    } catch (error) {
      console.error('Error checking active alerts:', error);
    }
  };

  // Countdown effect
  useEffect(() => {
    let timer;
    if (countdownActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdownActive && countdown === 0) {
      triggerSOS();
    }
    return () => clearTimeout(timer);
  }, [countdown, countdownActive]);

  // Start SOS countdown
  const startSOSCountdown = () => {
    if (!location) {
      toast.error('Please enable location to trigger SOS');
      getCurrentLocation();
      return;
    }
    setCountdownActive(true);
    setShowConfirmModal(true);
  };

  // Cancel SOS countdown
  const cancelSOSCountdown = () => {
    setCountdownActive(false);
    setCountdown(5);
    setShowConfirmModal(false);
  };

  // Trigger SOS alert
  const triggerSOS = async () => {
    setShowConfirmModal(false);
    setCountdownActive(false);
    setLoading(true);

    try {
      const sosData = {
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
        message: 'Emergency SOS Alert!',
        alertType: 'sos',
      };

      // Emit via socket for real-time
      if (isConnected) {
        emitSOS(sosData);
      }

      // Also send via API
      const response = await sosAPI.trigger(sosData);
      
      if (response.data.success) {
        setActiveSOS(response.data.alert);
        setSosActive(true);
        toast.success('SOS Alert sent! Help is on the way.');
      }
    } catch (error) {
      toast.error('Failed to send SOS. Please try again or call emergency services.');
      console.error('SOS error:', error);
    } finally {
      setLoading(false);
      setCountdown(5);
    }
  };

  // Cancel SOS alert
  const cancelSOS = async () => {
    if (!activeSOS) return;

    setLoading(true);
    try {
      const response = await sosAPI.updateStatus(activeSOS._id, {
        status: 'cancelled',
        message: 'Alert cancelled by user',
      });

      if (response.data.success) {
        setSosActive(false);
        setActiveSOS(null);
        toast.success('SOS Alert cancelled');
      }
    } catch (error) {
      toast.error('Failed to cancel SOS');
      console.error('Cancel SOS error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark as safe
  const markAsSafe = async () => {
    if (!activeSOS) return;

    setLoading(true);
    try {
      const response = await sosAPI.updateStatus(activeSOS._id, {
        status: 'resolved',
        message: 'User marked as safe',
      });

      if (response.data.success) {
        setSosActive(false);
        setActiveSOS(null);
        toast.success('Glad you are safe!');
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Mark safe error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Women Safety SOS
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          One-tap emergency alert with live location sharing
        </p>
      </div>

      {/* Location Status */}
      <Card className={`${location ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
        <div className="flex items-center gap-3">
          <HiLocationMarker className={`w-6 h-6 ${location ? 'text-green-500' : 'text-yellow-500'}`} />
          <div>
            <p className={`font-medium ${location ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
              {location ? 'Location Active' : 'Location Required'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {location 
                ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
                : locationError || 'Enable GPS for accurate location sharing'
              }
            </p>
          </div>
          {!location && (
            <Button size="sm" variant="secondary" onClick={getCurrentLocation}>
              Enable
            </Button>
          )}
        </div>
      </Card>

      {/* SOS Button */}
      <div className="flex justify-center py-8">
        {!sosActive ? (
          <motion.button
            onClick={startSOSCountdown}
            disabled={loading || !location}
            className={`
              w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-600
              text-white font-bold text-2xl shadow-2xl shadow-red-500/50
              flex flex-col items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              relative overflow-hidden
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse animation */}
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <HiShieldExclamation className="w-16 h-16 relative z-10" />
            <span className="relative z-10">SOS</span>
          </motion.button>
        ) : (
          <div className="text-center space-y-6">
            {/* Active SOS Status */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex flex-col items-center justify-center shadow-2xl shadow-green-500/50 mx-auto"
            >
              <HiExclamation className="w-16 h-16 animate-pulse" />
              <span className="font-bold text-xl">ALERT ACTIVE</span>
            </motion.div>

            <div className="space-y-3">
              <Button
                variant="success"
                size="lg"
                fullWidth
                icon={HiCheck}
                onClick={markAsSafe}
                loading={loading}
              >
                I'm Safe
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                icon={HiX}
                onClick={cancelSOS}
                loading={loading}
              >
                Cancel Alert
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!sosActive && (
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            How SOS Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>Press and hold the SOS button for 5 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>Your live location is shared with emergency contacts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>Nearby responders are immediately notified</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
              <span>Help is dispatched to your location</span>
            </li>
          </ul>
        </Card>
      )}

      {/* Emergency Contacts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HiUsers className="w-5 h-5 text-primary" />
            Emergency Contacts
          </h3>
        </div>
        <div className="space-y-3">
          {emergencyContacts.map((contact, index) => (
            <a
              key={index}
              href={`tel:${contact.phone}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {contact.name}
                </p>
                <p className="text-sm text-gray-500">{contact.phone}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <HiPhone className="w-5 h-5 text-green-500" />
              </div>
            </a>
          ))}
        </div>
      </Card>

      {/* Countdown Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={cancelSOSCountdown}
        closeOnOverlay={false}
        showClose={false}
      >
        <div className="text-center py-6">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6"
          >
            <span className="text-6xl font-bold text-red-500">
              {countdown}
            </span>
          </motion.div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sending SOS Alert...
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Alert will be sent in {countdown} seconds
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={cancelSOSCountdown}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={triggerSOS}
            >
              Send Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SOS;

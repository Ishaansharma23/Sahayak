import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiTruck,
  HiLocationMarker,
  HiPhone,
  HiOfficeBuilding,
  HiClock,
  HiCheck,
  HiRefresh,
  HiArrowLeft,
} from 'react-icons/hi';
import { emergencyAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const EmergencyTrack = () => {
  const { id } = useParams();
  const { socket } = useSocket();
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergency();
  }, [id]);

  useEffect(() => {
    if (socket && emergency) {
      // Join emergency room for real-time updates
      socket.emit('trackEmergency', id);

      socket.on('ambulanceLocation', (data) => {
        if (data.emergencyId === id) {
          setEmergency(prev => ({
            ...prev,
            currentLocation: data.location,
          }));
        }
      });

      socket.on('emergencyUpdate', (data) => {
        if (data.emergencyId === id) {
          setEmergency(prev => ({
            ...prev,
            status: data.status,
          }));
        }
      });

      return () => {
        socket.emit('stopTrackingEmergency', id);
        socket.off('ambulanceLocation');
        socket.off('emergencyUpdate');
      };
    }
  }, [socket, emergency, id]);

  const fetchEmergency = async () => {
    try {
      const response = await emergencyAPI.getById(id);
      if (response.data.success) {
        setEmergency(response.data.emergency);
      }
    } catch (error) {
      console.error('Error fetching emergency:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      accepted: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      dispatched: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      on_the_way: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      arrived_pickup: 'bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-100',
      en_route_hospital: 'bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-100',
      arrived_hospital: 'bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-100',
      completed: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[status] || colors.requested;
  };

  const statusSteps = [
    { id: 'requested', label: 'Request Received', icon: HiCheck },
    { id: 'accepted', label: 'Accepted', icon: HiCheck },
    { id: 'dispatched', label: 'Ambulance Dispatched', icon: HiTruck },
    { id: 'on_the_way', label: 'On the Way', icon: HiLocationMarker },
    { id: 'arrived_pickup', label: 'Arrived at Pickup', icon: HiOfficeBuilding },
    { id: 'en_route_hospital', label: 'En Route to Hospital', icon: HiLocationMarker },
    { id: 'arrived_hospital', label: 'Arrived at Hospital', icon: HiOfficeBuilding },
    { id: 'completed', label: 'Completed', icon: HiCheck },
  ];

  const getCurrentStep = () => {
    return statusSteps.findIndex(s => s.id === emergency?.status);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!emergency) {
    return (
      <div className="text-center py-12">
        <HiTruck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Emergency not found
        </h3>
        <Link to="/emergency">
          <Button variant="secondary" icon={HiArrowLeft}>
            Back to Emergency
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/emergency"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
      >
        <HiArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <Card className="bg-gradient-to-br from-primary to-secondary text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Emergency #{emergency._id?.slice(-6).toUpperCase()}
            </h1>
            <p className="text-white/90">
              {emergency.type} Emergency
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full font-medium ${getStatusColor(emergency.status)}`}>
            {emergency.status?.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
      </Card>

      {/* Status Timeline */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Status Timeline
        </h2>
        <div className="relative">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const currentStep = getCurrentStep();
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.id} className="flex items-start gap-4 pb-6 last:pb-0">
                {/* Line */}
                {index < statusSteps.length - 1 && (
                  <div
                    className={`absolute left-5 mt-10 w-0.5 h-12 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
                
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }
                    ${isCurrent ? 'ring-4 ring-green-200 dark:ring-green-900' : ''}
                  `}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                {/* Content */}
                <div>
                  <p className={`font-medium ${
                    isCompleted 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && emergency.status === 'on_the_way' && emergency.estimatedArrival && (
                    <p className="text-sm text-primary">
                      ETA: {new Date(emergency.estimatedArrival).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Ambulance Info */}
      {emergency.ambulance && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ambulance Details
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <HiTruck className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {emergency.ambulance.vehicleNumber || 'Ambulance'}
              </p>
              <p className="text-sm text-gray-500">
                {emergency.ambulance.type || 'Emergency Vehicle'}
              </p>
            </div>
            {emergency.ambulance.driver?.phone && (
              <a
                href={`tel:${emergency.ambulance.driver.phone}`}
                className="ml-auto"
              >
                <Button variant="success" icon={HiPhone}>
                  Call Driver
                </Button>
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Hospital Info */}
      {emergency.hospital && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Destination Hospital
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <HiOfficeBuilding className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {emergency.hospital.name}
              </p>
              <p className="text-sm text-gray-500">
                {emergency.hospital.address?.city}
              </p>
            </div>
            {emergency.hospital.contact?.phone && (
              <a href={`tel:${emergency.hospital.contact.phone}`}>
                <Button variant="secondary" icon={HiPhone}>
                  Call
                </Button>
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Request Details */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Request Details
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Request Time</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(emergency.createdAt).toLocaleString()}
            </span>
          </div>
          {emergency.patient?.name && (
            <div className="flex justify-between">
              <span className="text-gray-500">Patient Name</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {emergency.patient.name}
              </span>
            </div>
          )}
          {emergency.patient?.condition && (
            <div className="flex justify-between">
              <span className="text-gray-500">Condition</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {emergency.patient.condition}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Contact</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {emergency.contactPhone}
            </span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          icon={HiRefresh}
          onClick={fetchEmergency}
          fullWidth
        >
          Refresh Status
        </Button>
        <a href="tel:102" className="flex-1">
          <Button variant="danger" icon={HiPhone} fullWidth>
            Call 102
          </Button>
        </a>
      </div>
    </div>
  );
};

export default EmergencyTrack;

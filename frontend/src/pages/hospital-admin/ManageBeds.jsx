import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiPlus,
  HiMinus,
  HiRefresh,
  HiCheckCircle,
  HiExclamation,
} from 'react-icons/hi';
import { IoBed } from 'react-icons/io5';
import { hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const ManageBeds = () => {
  const [bedData, setBedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  const bedTypes = [
    { key: 'general', label: 'General Ward', color: 'blue', icon: '🛏️' },
    { key: 'icu', label: 'ICU', color: 'red', icon: '🏥' },
    { key: 'ventilators', label: 'Ventilators', color: 'orange', icon: '🫁' },
    { key: 'emergency', label: 'Emergency', color: 'orange', icon: '🚨' },
    { key: 'pediatric', label: 'Pediatric', color: 'green', icon: '👶' },
    { key: 'maternity', label: 'Maternity', color: 'pink', icon: '🤱' },
    { key: 'surgical', label: 'Surgical', color: 'purple', icon: '🔪' },
  ];

  useEffect(() => {
    fetchBedData();
  }, []);

  const fetchBedData = async () => {
    setLoading(true);
    try {
      const hospitalId = user?.hospitalProfile?._id || user?.hospitalProfile || user?.hospital;
      if (!hospitalId) {
        throw new Error('Hospital profile is missing for this account');
      }

      const response = await hospitalAPI.getStats(hospitalId);
      if (response.data.success) {
        const beds = response.data.stats?.beds || {};
        const normalized = bedTypes.reduce((acc, type) => {
          const entry = beds[type.key] || { total: 0, available: 0 };
          const available = entry.available || 0;
          const total = entry.total || 0;
          acc[type.key] = {
            total,
            available,
            occupied: Math.max(0, total - available),
          };
          return acc;
        }, {});
        setBedData(normalized);
      }
    } catch (error) {
      console.error('Error fetching bed data:', error);
      setBedData({});
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBed = async (type, action) => {
    if (!bedData || !bedData[type]) return;

    const current = bedData[type];
    let newAvailable = current.available;

    if (action === 'increase') {
      if (current.available >= current.total) {
        toast.error('Cannot exceed total beds');
        return;
      }
      newAvailable = current.available + 1;
    } else {
      if (current.available <= 0) {
        toast.error('No available beds to occupy');
        return;
      }
      newAvailable = current.available - 1;
    }

    setUpdating(true);
    try {
      const hospitalId = user?.hospitalProfile?._id || user?.hospitalProfile || user?.hospital;
      if (!hospitalId) {
        throw new Error('Hospital profile is missing for this account');
      }

      const response = await hospitalAPI.updateBeds(hospitalId, {
        bedType: type,
        available: newAvailable,
      });

      if (response.data.success) {
        setBedData(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            available: newAvailable,
            occupied: prev[type].total - newAvailable,
          },
        }));

        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('updateBeds', {
            hospitalId,
            hospitalName: user?.hospitalProfile?.name || user?.hospital?.name || 'Hospital',
            bedType: type,
            available: newAvailable,
          });
        }

        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} beds updated`);
      }
    } catch (error) {
      // Update locally for demo
      setBedData(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          available: newAvailable,
          occupied: prev[type].total - newAvailable,
        },
      }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} beds updated`);
    } finally {
      setUpdating(false);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        progress: 'bg-blue-500',
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        progress: 'bg-red-500',
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        progress: 'bg-orange-500',
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        progress: 'bg-green-500',
      },
      pink: {
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-800',
        progress: 'bg-pink-500',
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        progress: 'bg-purple-500',
      },
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading bed data..." />
      </div>
    );
  }

  const totalBeds = bedData ? Object.values(bedData).reduce((acc, b) => acc + (b.total || 0), 0) : 0;
  const totalAvailable = bedData ? Object.values(bedData).reduce((acc, b) => acc + (b.available || 0), 0) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Beds
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update bed availability in real-time
          </p>
        </div>
        <Button variant="secondary" icon={HiRefresh} onClick={fetchBedData}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Beds</p>
              <p className="text-4xl font-bold mt-1">{totalBeds}</p>
            </div>
            <IoBed className="w-12 h-12 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Available</p>
              <p className="text-4xl font-bold mt-1">{totalAvailable}</p>
            </div>
            <HiCheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Occupied</p>
              <p className="text-4xl font-bold mt-1">{totalBeds - totalAvailable}</p>
            </div>
            <HiExclamation className="w-12 h-12 text-orange-200" />
          </div>
        </Card>
      </div>

      {/* Bed Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bedTypes.map((type, index) => {
          const data = bedData?.[type.key] || { total: 0, available: 0, occupied: 0 };
          const colorClasses = getColorClasses(type.color);
          const occupancyRate = data.total > 0 ? ((data.occupied / data.total) * 100).toFixed(0) : 0;

          return (
            <motion.div
              key={type.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-2 ${colorClasses.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {type.label}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {data.total} total beds
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                    {occupancyRate}% full
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClasses.progress} transition-all duration-500`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{data.available}</p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{data.occupied}</p>
                    <p className="text-xs text-gray-500">Occupied</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    size="sm"
                    className="flex-1"
                    icon={HiPlus}
                    onClick={() => handleUpdateBed(type.key, 'increase')}
                    disabled={updating}
                  >
                    Free Bed
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    icon={HiMinus}
                    onClick={() => handleUpdateBed(type.key, 'decrease')}
                    disabled={updating}
                  >
                    Occupy
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <IoBed className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
              Real-time Updates
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Bed availability updates are broadcast in real-time to all users searching for emergency services.
              Keep your bed counts accurate to help patients find care quickly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ManageBeds;

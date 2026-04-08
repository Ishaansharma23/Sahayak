import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOfficeBuilding,
  HiUsers,
  HiTruck,
  HiClock,
  HiTrendingUp,
  HiExclamationCircle,
  HiBell,
  HiArrowRight,
} from 'react-icons/hi';
import { IoBed } from 'react-icons/io5';
import { hospitalAPI, emergencyAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const HospitalDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_emergency_request', (emergency) => {
        setRecentEmergencies(prev => [emergency, ...prev.slice(0, 4)]);
      });

      return () => {
        socket.off('new_emergency_request');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const hospitalId = user?.hospitalProfile?._id || user?.hospitalProfile || user?.hospital;
      if (!hospitalId) {
        throw new Error('Hospital profile is missing for this account');
      }

      const [statsRes, emergenciesRes] = await Promise.all([
        hospitalAPI.getStats(hospitalId),
        emergencyAPI.getActiveEmergencies(hospitalId),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (emergenciesRes.data.success) {
        setRecentEmergencies(emergenciesRes.data.emergencies?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Mock data
      setStats({
        beds: { total: 200, available: 45, icu: { total: 20, available: 5 }, general: { total: 150, available: 35 }, emergency: { total: 30, available: 5 } },
        ambulances: { total: 10, available: 6 },
        doctorCount: 35,
        emergencyStats: { requested: { count: 3 } },
      });
      setRecentEmergencies([
        { _id: '1', type: 'medical', patient: { name: 'John Doe' }, status: 'pending', createdAt: new Date().toISOString() },
        { _id: '2', type: 'accident', patient: { name: 'Jane Smith' }, status: 'dispatched', createdAt: new Date(Date.now() - 1800000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Beds',
      value: stats?.beds?.available || 0,
      subValue: `of ${stats?.beds?.total || 0}`,
      icon: IoBed,
      color: 'blue',
      link: '/hospital-admin/beds',
    },
    {
      title: 'Ambulances',
      value: stats?.ambulances?.available || 0,
      subValue: `of ${stats?.ambulances?.total || 0}`,
      icon: HiTruck,
      color: 'green',
      link: '/hospital-admin/ambulances',
    },
    {
      title: 'Active Doctors',
      value: stats?.doctorCount || 0,
      subValue: 'Registered',
      icon: HiUsers,
      color: 'purple',
      link: '/doctors',
    },
    {
      title: 'Pending Emergencies',
      value: stats?.emergencyStats?.requested?.count || 0,
      subValue: 'Awaiting response',
      icon: HiExclamationCircle,
      color: 'red',
      link: '/emergency',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hospital Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your hospital resources and emergencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={HiBell}>
            Alerts
          </Button>
          <Button icon={HiTrendingUp}>
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </span>
                      <span className="text-sm text-gray-500">{stat.subValue}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bed Distribution */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bed Availability
            </h2>
            <Link to="/hospital-admin/beds">
              <Button variant="ghost" size="sm" icon={HiArrowRight} iconPosition="right">
                Manage
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['icu', 'general', 'emergency'].map((type) => {
              const bedData = stats?.beds?.[type] || { total: 0, available: 0 };
              const percentage = bedData.total > 0 ? (bedData.available / bedData.total) * 100 : 0;

              return (
                <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-sm text-gray-500 capitalize mb-2">{type}</p>
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        className="text-gray-200 dark:text-gray-600"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="32"
                        cx="40"
                        cy="40"
                      />
                      <circle
                        className={`${percentage > 30 ? 'text-green-500' : percentage > 10 ? 'text-yellow-500' : 'text-red-500'}`}
                        strokeWidth="8"
                        strokeDasharray={`${percentage * 2.01} 201`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="32"
                        cx="40"
                        cy="40"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {bedData.available} / {bedData.total}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link to="/hospital-admin/beds" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <IoBed className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-400 font-medium">Update Bed Availability</span>
              </div>
            </Link>
            <Link to="/hospital-admin/ambulances" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <HiTruck className="w-5 h-5 text-green-600" />
                <span className="text-green-700 dark:text-green-400 font-medium">Manage Ambulances</span>
              </div>
            </Link>
            <Link to="/emergency" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                <HiExclamationCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 dark:text-red-400 font-medium">View Emergencies</span>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Emergencies */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Emergency Requests
          </h2>
          <Link to="/emergency">
            <Button variant="ghost" size="sm" icon={HiArrowRight} iconPosition="right">
              View All
            </Button>
          </Link>
        </div>

        {recentEmergencies.length === 0 ? (
          <div className="text-center py-8">
            <HiExclamationCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No recent emergencies</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEmergencies.map((emergency) => (
              <div
                key={emergency._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    emergency.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-600'
                      : emergency.status === 'dispatched'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <HiExclamationCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {emergency.patient?.name || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {emergency.type} Emergency
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    emergency.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : emergency.status === 'dispatched'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {emergency.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    <HiClock className="inline w-3 h-3 mr-1" />
                    {new Date(emergency.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default HospitalDashboard;

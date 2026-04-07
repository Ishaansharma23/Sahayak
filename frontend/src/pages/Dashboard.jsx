import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOfficeBuilding,
  HiUserGroup,
  HiPhone,
  HiShieldExclamation,
  HiTrendingUp,
  HiClock,
  HiLocationMarker,
  HiArrowRight,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { hospitalAPI, doctorAPI, emergencyAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch nearby hospitals
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await hospitalAPI.getNearby({
              lat: latitude,
              lng: longitude,
              maxDistance: 10,
              limit: 5,
            });
            if (response.data.success) {
              setNearbyHospitals(response.data.hospitals || []);
            }
          } catch (err) {
            console.error('Error fetching nearby hospitals:', err);
          }
        });
      }

      // Fetch user's emergencies
      try {
        const emergencyRes = await emergencyAPI.getMyEmergencies();
        if (emergencyRes.data.success) {
          setRecentEmergencies(emergencyRes.data.emergencies?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error('Error fetching emergencies:', err);
      }

      // Set mock stats for now
      setStats({
        hospitalsNearby: 12,
        doctorsAvailable: 45,
        ambulancesActive: 8,
        avgResponseTime: '8 min',
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'Find Hospital',
      icon: HiOfficeBuilding,
      href: '/hospitals',
      color: 'bg-blue-500',
      description: 'Search nearby hospitals',
    },
    {
      name: 'Find Doctor',
      icon: HiUserGroup,
      href: '/doctors',
      color: 'bg-green-500',
      description: 'Consult with doctors',
    },
    {
      name: 'Emergency',
      icon: HiPhone,
      href: '/emergency',
      color: 'bg-red-500',
      description: 'Request ambulance',
    },
    {
      name: 'SOS Alert',
      icon: HiShieldExclamation,
      href: '/sos',
      color: 'bg-purple-500',
      description: 'Women safety alert',
    },
  ];

  const statCards = [
    {
      name: 'Nearby Hospitals',
      value: stats?.hospitalsNearby || 0,
      icon: HiOfficeBuilding,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: 'Doctors Available',
      value: stats?.doctorsAvailable || 0,
      icon: HiUserGroup,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      name: 'Active Ambulances',
      value: stats?.ambulancesActive || 0,
      icon: HiTrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      name: 'Avg Response Time',
      value: stats?.avgResponseTime || '-',
      icon: HiClock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-white/90">
              Your health and safety dashboard is ready. Stay protected.
            </p>
          </div>
          <Link to="/sos">
            <Button variant="sos" size="lg">
              🆘 Trigger SOS
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={action.href}>
                  <Card hover className="text-center">
                    <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {action.description}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Nearby Hospitals */}
        <Card padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nearby Hospitals
            </h2>
            <Link to="/hospitals" className="text-primary text-sm hover:underline flex items-center gap-1">
              View all <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {nearbyHospitals.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <HiLocationMarker className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Enable location to see nearby hospitals</p>
              </div>
            ) : (
              nearbyHospitals.map((hospital) => (
                <Link
                  key={hospital._id}
                  to={`/hospitals/${hospital._id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <HiOfficeBuilding className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {hospital.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {hospital.distance ? `${hospital.distance.toFixed(1)} km away` : hospital.address?.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      hospital.beds?.available > 5 
                        ? 'bg-green-100 text-green-700' 
                        : hospital.beds?.available > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {hospital.beds?.available || 0} beds
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Recent Emergencies */}
        <Card padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Emergency History
            </h2>
            <Link to="/emergency" className="text-primary text-sm hover:underline flex items-center gap-1">
              View all <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentEmergencies.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <HiPhone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No emergency requests yet</p>
              </div>
            ) : (
              recentEmergencies.map((emergency) => (
                <Link
                  key={emergency._id}
                  to={`/emergency/${emergency._id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    emergency.status === 'completed' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : emergency.status === 'dispatched'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <HiPhone className={`w-6 h-6 ${
                      emergency.status === 'completed' 
                        ? 'text-green-500' 
                        : emergency.status === 'dispatched'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {emergency.type} Emergency
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(emergency.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full capitalize ${
                    emergency.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : emergency.status === 'dispatched'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {emergency.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

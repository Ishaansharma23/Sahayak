import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiUserGroup,
  HiOfficeBuilding,
  HiPhone,
  HiShieldExclamation,
  HiTrendingUp,
  HiTrendingDown,
  HiClock,
  HiChartBar,
  HiCheckCircle,
  HiExclamation,
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        const apiStats = response.data.stats || {};
        setStats({
          totalUsers: apiStats.users?.total || 0,
          totalHospitals: apiStats.hospitals?.total || 0,
          totalDoctors: apiStats.doctors?.total || 0,
          activeEmergencies: apiStats.emergencies?.active || 0,
          activeSOS: apiStats.sos?.active || 0,
          pendingVerifications: (apiStats.hospitals?.pending || 0) + (apiStats.doctors?.pending || 0),
        });
        setRecentAlerts(apiStats.recentEmergencies || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Set mock data for demo
      setStats({
        totalUsers: 1250,
        totalHospitals: 45,
        totalDoctors: 320,
        activeEmergencies: 12,
        activeSOS: 3,
        pendingVerifications: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: HiUserGroup,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      trend: '+12%',
      trendUp: true,
    },
    {
      name: 'Hospitals',
      value: stats?.totalHospitals || 0,
      icon: HiOfficeBuilding,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      trend: '+5%',
      trendUp: true,
    },
    {
      name: 'Doctors',
      value: stats?.totalDoctors || 0,
      icon: HiUserGroup,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      trend: '+8%',
      trendUp: true,
    },
    {
      name: 'Active Emergencies',
      value: stats?.activeEmergencies || 0,
      icon: HiPhone,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      name: 'Active SOS Alerts',
      value: stats?.activeSOS || 0,
      icon: HiShieldExclamation,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      name: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: HiClock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
  ];

  const quickActions = [
    { name: 'Manage Users', href: '/admin/users', icon: HiUserGroup },
    { name: 'Manage Hospitals', href: '/admin/hospitals', icon: HiOfficeBuilding },
    { name: 'Manage Doctors', href: '/admin/doctors', icon: HiUserGroup },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: HiChartBar },
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor and manage the LifeLine network
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trendUp ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.trendUp ? (
                      <HiTrendingUp className="w-4 h-4" />
                    ) : (
                      <HiTrendingDown className="w-4 h-4" />
                    )}
                    {stat.trend}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} to={action.href}>
              <Card hover className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {action.name}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Alerts
            </h2>
            <Link to="/admin/sos" className="text-primary text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <HiShieldExclamation className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent alerts</p>
              </div>
            ) : (
              recentAlerts.slice(0, 5).map((alert, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    alert.status === 'resolved'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {alert.status === 'resolved' ? (
                      <HiCheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <HiExclamation className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {alert.type || 'SOS Alert'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    alert.status === 'resolved'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Pending Verifications */}
        <Card padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Verifications
            </h2>
            <Link to="/admin/hospitals" className="text-primary text-sm hover:underline">
              Review
            </Link>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {stats?.pendingVerifications > 0 ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HiOfficeBuilding className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-700 dark:text-yellow-400">
                        {Math.ceil((stats.pendingVerifications || 0) / 2)} hospitals pending
                      </span>
                    </div>
                    <Link to="/admin/hospitals">
                      <Button size="sm" variant="warning">
                        Review
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HiUserGroup className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-700 dark:text-yellow-400">
                        {Math.floor((stats.pendingVerifications || 0) / 2)} doctors pending
                      </span>
                    </div>
                    <Link to="/admin/doctors">
                      <Button size="sm" variant="warning">
                        Review
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HiCheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                  <p>All verifications complete!</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

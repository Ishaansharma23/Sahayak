import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiCalendar,
  HiUsers,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowRight,
  HiPhone,
  HiVideoCamera,
} from 'react-icons/hi';
import { doctorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const DoctorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const doctorId = user?.doctorProfile?._id || user?.doctorProfile;
      if (doctorId) {
        const response = await doctorAPI.getById(doctorId);
        if (response.data.success) {
          setDoctorProfile(response.data.doctor);
          const profileStats = response.data.doctor?.stats || {};
          setStats({
            totalPatients: profileStats.totalPatients || 0,
            todayAppointments: 0,
            completedToday: 0,
            pendingToday: 0,
            rating: response.data.doctor?.rating?.average || 0,
            totalReviews: response.data.doctor?.rating?.count || 0,
          });
        }
      }
      setAppointments([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalPatients: 0,
        todayAppointments: 0,
        completedToday: 0,
        pendingToday: 0,
        rating: 0,
        totalReviews: 0,
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: HiUsers,
      color: 'blue',
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: HiCalendar,
      color: 'purple',
    },
    {
      title: 'Completed',
      value: stats?.completedToday || 0,
      icon: HiCheckCircle,
      color: 'green',
    },
    {
      title: 'Pending',
      value: stats?.pendingToday || 0,
      icon: HiClock,
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || colors.pending;
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
            Welcome, Dr. {user?.name?.split(' ')[1] || user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your schedule for today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/doctor/schedule">
            <Button variant="secondary" icon={HiCalendar}>
              Manage Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Appointments
              </h2>
              <Link to="/doctor/schedule">
                <Button variant="ghost" size="sm" icon={HiArrowRight} iconPosition="right">
                  Manage
                </Button>
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <HiCalendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No appointments scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      appointment.status === 'in-progress'
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                          {appointment.patient?.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {appointment.patient?.name}
                        </h3>
                        <p className="text-sm text-gray-500">{appointment.reason}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <HiClock className="w-3 h-3" /> {appointment.time}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            {appointment.type === 'video' ? (
                              <><HiVideoCamera className="w-3 h-3" /> Video</>
                            ) : (
                              <><HiUsers className="w-3 h-3" /> In-person</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'pending' && (
                        <div className="flex gap-2">
                          {appointment.type === 'video' && (
                            <Button size="sm" variant="secondary" icon={HiVideoCamera}>
                              Start
                            </Button>
                          )}
                          <Button size="sm" icon={HiCheckCircle}>
                            Begin
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions & Rating */}
        <div className="space-y-6">
          {/* Rating Card */}
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
            <div className="text-center">
              <p className="text-yellow-100 mb-2">Your Rating</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold">{stats?.rating || 0}</span>
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-yellow-100 mt-2">
                Based on {stats?.totalReviews || 0} reviews
              </p>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link to="/doctor/schedule" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <HiCalendar className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-700 dark:text-purple-400 font-medium">Update Schedule</span>
                </div>
              </Link>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 dark:text-green-400 font-medium">Mark Available</span>
              </div>
              <Link to="/emergencies" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <HiExclamationCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 dark:text-red-400 font-medium">View Emergencies</span>
                </div>
              </Link>
            </div>
          </Card>

          {/* Upcoming */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Next Patient
            </h2>
            {appointments.find(a => a.status === 'pending') ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">
                    {appointments.find(a => a.status === 'pending')?.patient?.name?.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {appointments.find(a => a.status === 'pending')?.patient?.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {appointments.find(a => a.status === 'pending')?.time}
                </p>
                <Button className="mt-4 w-full" size="sm" icon={HiPhone}>
                  Call Patient
                </Button>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No pending appointments
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

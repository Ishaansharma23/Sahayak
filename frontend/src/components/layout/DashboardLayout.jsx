import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiOfficeBuilding,
  HiUserGroup,
  HiPhone,
  HiShieldExclamation,
  HiUser,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiBell,
  HiChartBar,
  HiClipboardList,
  HiClock,
  HiTruck,
  HiHeart,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const { notifications, unreadCount, clearNotifications } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HiHome },
      { name: 'Hospitals', href: '/hospitals', icon: HiOfficeBuilding },
      { name: 'Doctors', href: '/doctors', icon: HiUserGroup },
      { name: 'Emergency', href: '/emergency', icon: HiPhone },
      { name: 'SOS', href: '/sos', icon: HiShieldExclamation },
      { name: 'Profile', href: '/profile', icon: HiUser },
    ];

    if (hasRole('hospital')) {
      return [
        { name: 'Dashboard', href: '/hospital-admin', icon: HiHome },
        { name: 'Manage Beds', href: '/hospital-admin/beds', icon: HiClipboardList },
        { name: 'Ambulances', href: '/hospital-admin/ambulances', icon: HiTruck },
        ...baseItems.slice(1),
      ];
    }

    if (hasRole('doctor')) {
      return [
        { name: 'Dashboard', href: '/doctor', icon: HiChartBar },
        { name: 'Schedule', href: '/doctor/schedule', icon: HiClock },
        ...baseItems.slice(1),
      ];
    }

    if (hasRole('admin')) {
      return [
        { name: 'Admin Dashboard', href: '/admin', icon: HiChartBar },
        { name: 'Manage Users', href: '/admin/users', icon: HiUserGroup },
        { name: 'Manage Hospitals', href: '/admin/hospitals', icon: HiOfficeBuilding },
        { name: 'Manage Doctors', href: '/admin/doctors', icon: HiUser },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: HiClipboardList },
        ...baseItems,
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 shadow-xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-500 rounded-xl flex items-center justify-center">
              <HiHeart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Life<span className="text-primary">Line</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.accountType}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <HiLogout className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 flex items-center justify-between px-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HiMenu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Page title - you can make this dynamic */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {navItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              >
                <HiBell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-sm text-primary hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-gray-500">
                          No notifications
                        </p>
                      ) : (
                        notifications.slice(0, 10).map((n, i) => (
                          <div
                            key={i}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                              !n.read ? 'bg-primary/5' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-900 dark:text-white">
                              {n.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(n.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SOS Button */}
            <Link to="/sos">
              <Button variant="sos" size="sm">
                🆘 SOS
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

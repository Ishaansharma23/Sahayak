import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHeart, HiPhone, HiShieldCheck } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-primary to-red-500 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <HiHeart className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Life<span className="text-primary">Line</span>
              </span>
            </Link>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/hospitals"
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                Hospitals
              </Link>
              <Link
                to="/doctors"
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                Doctors
              </Link>
              <Link
                to="/emergency"
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors flex items-center gap-1"
              >
                <HiPhone className="w-4 h-4" />
                Emergency
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
              </button>

              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login / Register</Button>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-500 rounded-lg flex items-center justify-center">
                  <HiHeart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  LifeLine
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Real-time emergency hospital network and women safety platform.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/hospitals" className="hover:text-primary">Find Hospitals</Link></li>
                <li><Link to="/doctors" className="hover:text-primary">Find Doctors</Link></li>
                <li><Link to="/emergency" className="hover:text-primary">Request Ambulance</Link></li>
                <li><Link to="/sos" className="hover:text-primary">SOS Help</Link></li>
              </ul>
            </div>

            {/* Emergency */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Emergency</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <HiPhone className="text-primary" />
                  <span>Ambulance: 102</span>
                </li>
                <li className="flex items-center gap-2">
                  <HiShieldCheck className="text-primary" />
                  <span>Women Helpline: 181</span>
                </li>
                <li className="flex items-center gap-2">
                  <HiPhone className="text-primary" />
                  <span>Police: 100</span>
                </li>
              </ul>
            </div>

            {/* Trust */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Trust & Safety</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All hospitals and doctors are verified. Your safety is our priority.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-1 text-green-500 text-sm">
                  <HiShieldCheck className="w-5 h-5" />
                  <span>Verified Network</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} LifeLine. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiArrowLeft } from 'react-icons/hi';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-9xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            404
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl -z-10 rounded-full" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button icon={HiHome} size="lg">
              Go Home
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-4">Popular Pages:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/hospitals" className="text-primary hover:underline">
              Find Hospitals
            </Link>
            <Link to="/doctors" className="text-primary hover:underline">
              Find Doctors
            </Link>
            <Link to="/emergency" className="text-primary hover:underline">
              Emergency
            </Link>
            <Link to="/sos" className="text-primary hover:underline">
              SOS Help
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

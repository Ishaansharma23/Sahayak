import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              fixed inset-0 z-50 flex items-center justify-center p-4
              overflow-y-auto
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`
                ${sizes[size]} w-full bg-white dark:bg-gray-800
                rounded-2xl shadow-2xl relative
              `}
            >
              {/* Header */}
              {(title || showClose) && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  {title && (
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <HiX className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-4">
                {children}
              </div>
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
};

export default Modal;

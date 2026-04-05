import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
  gradient = false,
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <motion.div
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-soft
        ${hover ? 'hover:shadow-lg cursor-pointer transition-shadow duration-300' : ''}
        ${gradient ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' : ''}
        ${paddings[padding]}
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default Card;

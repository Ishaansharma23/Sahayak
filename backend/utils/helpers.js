/**
 * Helper utilities for LifeLine application
 */

/**
 * Generate a random alphanumeric string
 * @param {number} length - Length of the string
 * @returns {string}
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string}
 */
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Sanitize object - remove undefined/null values
 * @param {Object} obj - Object to sanitize
 * @returns {Object}
 */
const sanitizeObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * Parse pagination parameters
 * @param {Object} query - Request query object
 * @returns {Object} Pagination options
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Create pagination response
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {Object} pagination - Pagination options
 * @returns {Object}
 */
const paginationResponse = (data, total, { page, limit }) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Parse sorting parameters
 * @param {string} sortString - Sort string (e.g., "-createdAt,name")
 * @returns {Object} MongoDB sort object
 */
const parseSort = (sortString) => {
  if (!sortString) return { createdAt: -1 };
  
  const sortObj = {};
  const fields = sortString.split(',');
  
  for (const field of fields) {
    if (field.startsWith('-')) {
      sortObj[field.slice(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  }
  
  return sortObj;
};

/**
 * Estimate arrival time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} avgSpeedKmh - Average speed in km/h (default: 40 for city)
 * @returns {Date}
 */
const estimateArrivalTime = (distanceKm, avgSpeedKmh = 40) => {
  const hoursToArrive = distanceKm / avgSpeedKmh;
  const minutesToArrive = Math.ceil(hoursToArrive * 60);
  
  return new Date(Date.now() + minutesToArrive * 60 * 1000);
};

/**
 * Format duration in human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string}
 */
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Get priority weight for sorting
 * @param {string} priority - Priority level
 * @returns {number}
 */
const getPriorityWeight = (priority) => {
  const weights = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };
  return weights[priority] || 5;
};

module.exports = {
  generateRandomString,
  calculateDistance,
  formatPhone,
  sanitizeObject,
  getPagination,
  paginationResponse,
  parseSort,
  estimateArrivalTime,
  formatDuration,
  getPriorityWeight,
};

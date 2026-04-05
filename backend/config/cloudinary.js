const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/**
 * Configure Cloudinary for document uploads
 */
const configureCloudinary = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('⚠️ Cloudinary not configured. File uploads will use local storage.');
    return null;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('✅ Cloudinary configured');
  return cloudinary;
};

/**
 * Create multer upload middleware with Cloudinary storage
 */
const createCloudinaryUploader = (folder = 'lifeline') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // Fallback to local storage
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    });
    
    return multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      }
    });
  }

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

module.exports = {
  configureCloudinary,
  createCloudinaryUploader,
  deleteFromCloudinary,
  cloudinary,
};

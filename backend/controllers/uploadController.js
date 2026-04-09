const path = require('path');
const { imagekit, isImageKitConfigured } = require('../config/imagekit');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');

const CATEGORY_FOLDER_MAP = {
  users: '/lifeline/users',
  doctors: '/lifeline/doctors',
  hospitals: '/lifeline/hospitals',
};

const buildFileName = (originalName = 'file') => {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension);
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${safeBase || 'file'}-${Date.now()}${extension}`;
};

/**
 * @desc    Upload file to ImageKit
 * @route   POST /api/uploads/:category
 * @access  Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!isImageKitConfigured()) {
    throw new ErrorResponse('ImageKit is not configured', 500);
  }

  if (!req.file) {
    throw new ErrorResponse('File is required', 400);
  }

  const category = String(req.params.category || '').toLowerCase();
  const folder = CATEGORY_FOLDER_MAP[category];

  if (!folder) {
    throw new ErrorResponse('Invalid upload category', 400);
  }

  const fileName = buildFileName(req.file.originalname);

  const result = await imagekit.upload({
    file: req.file.buffer,
    fileName,
    folder,
    useUniqueFileName: true,
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      filePath: result.filePath,
      size: result.size,
      height: result.height,
      width: result.width,
    },
  });
});

module.exports = {
  uploadFile,
};

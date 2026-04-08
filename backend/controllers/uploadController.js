const imagekit = require('../config/imagekit');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get ImageKit auth signature
 * @route   GET /api/uploads/imagekit-auth
 * @access  Private
 */
const getImageKitAuth = asyncHandler(async (req, res) => {
  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    throw new ErrorResponse('ImageKit is not configured', 500);
  }

  const result = imagekit.getAuthenticationParameters();

  res.status(200).json({
    success: true,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    ...result,
  });
});

module.exports = {
  getImageKitAuth,
};

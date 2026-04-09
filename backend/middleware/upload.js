const multer = require('multer');
const { ErrorResponse } = require('./errorHandler');

const MAX_FILE_SIZE_MB = Number.parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || '5', 10);
const MAX_FILE_SIZE = (Number.isNaN(MAX_FILE_SIZE_MB) ? 5 : MAX_FILE_SIZE_MB) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new ErrorResponse('Invalid file type. Only images and PDFs are allowed.', 400));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const uploadSingle = upload.single('file');

module.exports = {
  uploadSingle,
  MAX_FILE_SIZE_MB,
};

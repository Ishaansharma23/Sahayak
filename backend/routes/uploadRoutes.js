const express = require('express');
const router = express.Router();

const { uploadFile } = require('../controllers/uploadController');
const { uploadSingle } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/:category', protect, uploadSingle, uploadFile);

module.exports = router;

const express = require('express');
const router = express.Router();

const { getImageKitAuth } = require('../controllers/uploadController');
router.get('/imagekit-auth', getImageKitAuth);

module.exports = router;

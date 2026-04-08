const express = require('express');
const router = express.Router();
const { getNearbyHospitals } = require('../controllers/geoController');

router.get('/nearby-hospitals', getNearbyHospitals);

module.exports = router;

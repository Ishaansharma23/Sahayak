const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get nearby hospitals from Google Places API
 * @route   GET /api/geo/nearby-hospitals
 * @access  Public
 */
const getNearbyHospitals = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query;

  if (!lat || !lng) {
    throw new ErrorResponse('Latitude and longitude are required', 400);
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new ErrorResponse('Google Maps API key is missing', 500);
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', radius);
  url.searchParams.set('type', 'hospital');
  url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new ErrorResponse('Failed to fetch nearby hospitals', 502);
  }

  const data = await response.json();

  const hospitals = (data.results || []).map((item) => ({
    placeId: item.place_id,
    name: item.name,
    address: item.vicinity,
    rating: item.rating,
    location: {
      lat: item.geometry?.location?.lat,
      lng: item.geometry?.location?.lng,
    },
  }));

  res.status(200).json({
    success: true,
    count: hospitals.length,
    hospitals,
  });
});

module.exports = {
  getNearbyHospitals,
};

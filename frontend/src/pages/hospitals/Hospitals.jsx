import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOfficeBuilding,
  HiLocationMarker,
  HiPhone,
  HiSearch,
  HiFilter,
  HiStar,
  HiShieldCheck,
} from 'react-icons/hi';
import { hospitalAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    emergency: false,
    icu: false,
    verified: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        ...filters,
      };

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 50;
      }

      const response = await hospitalAPI.getAll(params);
      if (response.data.success) {
        setHospitals(response.data.hospitals || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, filters, userLocation]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchHospitals();
  };

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Find Hospitals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Search nearby hospitals with real-time bed availability
          </p>
        </div>
        <Link to="/emergency">
          <Button variant="danger" icon={HiPhone}>
            Emergency Request
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search hospitals by name, city, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={HiSearch}
            />
          </div>
          <Button type="submit" icon={HiSearch}>
            Search
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={HiFilter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </form>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filter by:
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'emergency', label: 'Emergency Services' },
                { key: 'icu', label: 'ICU Available' },
                { key: 'verified', label: 'Verified Only' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => toggleFilter(filter.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters[filter.key]
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading text="Finding hospitals..." />
        </div>
      ) : hospitals.length === 0 ? (
        <Card className="text-center py-12">
          <HiOfficeBuilding className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hospitals found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters
          </p>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital, index) => (
              <motion.div
                key={hospital._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/hospitals/${hospital._id}`}>
                  <Card hover className="h-full">
                    {/* Hospital Image/Header */}
                    <div className="relative h-40 -mx-4 -mt-4 mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-xl flex items-center justify-center">
                      {hospital.images?.[0] ? (
                        <img
                          src={hospital.images[0]}
                          alt={hospital.name}
                          className="w-full h-full object-cover rounded-t-xl"
                        />
                      ) : (
                        <HiOfficeBuilding className="w-16 h-16 text-white/50" />
                      )}
                      
                      {/* Verified Badge */}
                      {hospital.isVerified && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <HiShieldCheck className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                      
                      {/* Distance Badge */}
                      {hospital.distance && (
                        <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <HiLocationMarker className="w-3 h-3" />
                          {hospital.distance.toFixed(1)} km
                        </div>
                      )}
                    </div>

                    {/* Hospital Info */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {hospital.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                      <HiLocationMarker className="w-4 h-4" />
                      <span className="truncate">
                        {hospital.address?.city}, {hospital.address?.state}
                      </span>
                    </p>

                    {/* Rating */}
                    {hospital.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        <HiStar className="w-5 h-5 text-yellow-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {hospital.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({hospital.totalReviews || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Bed Availability */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        hospital.beds?.available > 5
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : hospital.beds?.available > 0
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {hospital.beds?.available || 0} Beds Available
                      </span>
                      {hospital.beds?.icu > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                          ICU: {hospital.beds.icu}
                        </span>
                      )}
                    </div>

                    {/* Services */}
                    <div className="flex flex-wrap gap-1">
                      {hospital.services?.slice(0, 3).map((service) => (
                        <span
                          key={service}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {service}
                        </span>
                      ))}
                      {hospital.services?.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-500">
                          +{hospital.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button
                variant="secondary"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Hospitals;

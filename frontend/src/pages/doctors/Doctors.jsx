import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiUserGroup,
  HiLocationMarker,
  HiPhone,
  HiSearch,
  HiFilter,
  HiStar,
  HiShieldCheck,
  HiClock,
} from 'react-icons/hi';
import { doctorAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

  const specialties = [
    'General Physician',
    'Cardiologist',
    'Neurologist',
    'Orthopedic',
    'Pediatrician',
    'Gynecologist',
    'Dermatologist',
    'ENT Specialist',
    'Psychiatrist',
    'Oncologist',
  ];

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        specialty: selectedSpecialty,
      };

      const response = await doctorAPI.getAll(params);
      if (response.data.success) {
        setDoctors(response.data.doctors || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, selectedSpecialty]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDoctors();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Find Doctors
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect with verified healthcare professionals
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search doctors by name, specialty..."
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

        {/* Specialty Filter */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Specialty:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedSpecialty('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedSpecialty
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => {
                    setSelectedSpecialty(specialty);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedSpecialty === specialty
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading text="Finding doctors..." />
        </div>
      ) : doctors.length === 0 ? (
        <Card className="text-center py-12">
          <HiUserGroup className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No doctors found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters
          </p>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/doctors/${doctor._id}`}>
                  <Card hover className="h-full">
                    {/* Doctor Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                        {doctor.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            Dr. {doctor.name}
                          </h3>
                          {doctor.isVerified && (
                            <HiShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-primary font-medium">
                          {doctor.specialty}
                        </p>
                        <p className="text-sm text-gray-500">
                          {doctor.qualification}
                        </p>
                      </div>
                    </div>

                    {/* Rating & Experience */}
                    <div className="flex items-center gap-4 mb-4">
                      {doctor.rating && (
                        <div className="flex items-center gap-1">
                          <HiStar className="w-5 h-5 text-yellow-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {doctor.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {doctor.experience && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <HiClock className="w-4 h-4" />
                          <span className="text-sm">{doctor.experience} years exp.</span>
                        </div>
                      )}
                    </div>

                    {/* Hospital */}
                    {doctor.hospital && (
                      <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                        <HiLocationMarker className="w-4 h-4" />
                        {doctor.hospital.name || doctor.hospital}
                      </p>
                    )}

                    {/* Availability */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        doctor.isAvailable
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {doctor.isAvailable ? 'Available' : 'Not Available'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ₹{doctor.consultationFee || 500}/visit
                      </span>
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

export default Doctors;

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOfficeBuilding,
  HiLocationMarker,
  HiPhone,
  HiMail,
  HiGlobe,
  HiClock,
  HiStar,
  HiShieldCheck,
  HiArrowLeft,
  HiUserGroup,
  HiTruck,
} from 'react-icons/hi';
import { hospitalAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const HospitalDetails = () => {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchHospital();
  }, [id]);

  const fetchHospital = async () => {
    try {
      const response = await hospitalAPI.getById(id);
      if (response.data.success) {
        setHospital(response.data.hospital);
      }
    } catch (error) {
      console.error('Error fetching hospital:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!hospital) {
    return (
      <div className="text-center py-12">
        <HiOfficeBuilding className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Hospital not found
        </h3>
        <Link to="/hospitals">
          <Button variant="secondary" icon={HiArrowLeft}>
            Back to Hospitals
          </Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'departments', label: 'Departments' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/hospitals"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
      >
        <HiArrowLeft className="w-5 h-5" />
        Back to Hospitals
      </Link>

      {/* Header Card */}
      <Card padding="none" className="overflow-hidden">
        {/* Hospital Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-blue-500 to-blue-600 relative">
          {hospital.images?.[0] ? (
            <img
              src={hospital.images[0]}
              alt={hospital.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HiOfficeBuilding className="w-24 h-24 text-white/30" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Verified Badge */}
          {hospital.isVerified && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
              <HiShieldCheck className="w-4 h-4" />
              Verified Hospital
            </div>
          )}
        </div>

        {/* Hospital Info */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {hospital.name}
              </h1>
              <p className="text-gray-500 flex items-center gap-1 mb-3">
                <HiLocationMarker className="w-5 h-5" />
                {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.state} - {hospital.address?.pincode}
              </p>
              
              {/* Rating */}
              {hospital.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                    <HiStar className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                      {hospital.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({hospital.totalReviews || 0} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                icon={HiPhone}
                onClick={() => window.open(`tel:${hospital.contact?.phone}`)}
              >
                Call Now
              </Button>
              <Link to="/emergency">
                <Button variant="danger" icon={HiTruck}>
                  Request Ambulance
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-500 mb-1">
            {hospital.beds?.available || 0}
          </p>
          <p className="text-sm text-gray-500">Beds Available</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-purple-500 mb-1">
            {hospital.beds?.icu || 0}
          </p>
          <p className="text-sm text-gray-500">ICU Beds</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-500 mb-1">
            {hospital.ambulances?.available || 0}
          </p>
          <p className="text-sm text-gray-500">Ambulances</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-orange-500 mb-1">
            {hospital.departments?.length || 0}
          </p>
          <p className="text-sm text-gray-500">Departments</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* About */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                About
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {hospital.description || 'No description available for this hospital.'}
              </p>
            </Card>

            {/* Contact Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {hospital.contact?.phone && (
                  <a
                    href={`tel:${hospital.contact.phone}`}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary"
                  >
                    <HiPhone className="w-5 h-5" />
                    {hospital.contact.phone}
                  </a>
                )}
                {hospital.contact?.email && (
                  <a
                    href={`mailto:${hospital.contact.email}`}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary"
                  >
                    <HiMail className="w-5 h-5" />
                    {hospital.contact.email}
                  </a>
                )}
                {hospital.contact?.website && (
                  <a
                    href={hospital.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary"
                  >
                    <HiGlobe className="w-5 h-5" />
                    {hospital.contact.website}
                  </a>
                )}
              </div>
            </Card>

            {/* Operating Hours */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Operating Hours
              </h3>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <HiClock className="w-5 h-5" />
                {hospital.operatingHours?.is24x7 ? (
                  <span className="text-green-500 font-medium">Open 24/7</span>
                ) : (
                  <span>
                    {hospital.operatingHours?.open || '9:00 AM'} - {hospital.operatingHours?.close || '9:00 PM'}
                  </span>
                )}
              </div>
            </Card>

            {/* Services */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Services
              </h3>
              <div className="flex flex-wrap gap-2">
                {hospital.services?.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="grid md:grid-cols-3 gap-4">
            {hospital.departments?.length > 0 ? (
              hospital.departments.map((dept, index) => (
                <motion.div
                  key={dept}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <HiOfficeBuilding className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {dept}
                    </span>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="col-span-3 text-center py-8 text-gray-500">
                No departments listed
              </Card>
            )}
          </div>
        )}

        {activeTab === 'doctors' && (
          <Card className="text-center py-12">
            <HiUserGroup className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Doctor Profiles Coming Soon
            </h3>
            <p className="text-gray-500 mb-4">
              View all doctors associated with this hospital
            </p>
            <Link to="/doctors">
              <Button variant="primary">
                Browse All Doctors
              </Button>
            </Link>
          </Card>
        )}

        {activeTab === 'reviews' && (
          <Card className="text-center py-12">
            <HiStar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reviews Coming Soon
            </h3>
            <p className="text-gray-500">
              Patient reviews and ratings will be available here
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HospitalDetails;

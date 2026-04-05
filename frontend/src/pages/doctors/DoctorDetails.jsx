import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiUserGroup,
  HiLocationMarker,
  HiPhone,
  HiMail,
  HiClock,
  HiStar,
  HiShieldCheck,
  HiArrowLeft,
  HiOfficeBuilding,
  HiCalendar,
} from 'react-icons/hi';
import { doctorAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const DoctorDetails = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      const response = await doctorAPI.getById(id);
      if (response.data.success) {
        setDoctor(response.data.doctor);
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <HiUserGroup className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Doctor not found
        </h3>
        <Link to="/doctors">
          <Button variant="secondary" icon={HiArrowLeft}>
            Back to Doctors
          </Button>
        </Link>
      </div>
    );
  }

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/doctors"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
      >
        <HiArrowLeft className="w-5 h-5" />
        Back to Doctors
      </Link>

      {/* Doctor Header */}
      <Card>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold">
              {doctor.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Dr. {doctor.name}
                  </h1>
                  {doctor.isVerified && (
                    <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-sm">
                      <HiShieldCheck className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-lg text-primary font-medium mb-1">
                  {doctor.specialty}
                </p>
                <p className="text-gray-500 mb-3">
                  {doctor.qualification}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-4">
                  {doctor.rating && (
                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full">
                      <HiStar className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                        {doctor.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-yellow-600 dark:text-yellow-500">
                        ({doctor.totalReviews || 0} reviews)
                      </span>
                    </div>
                  )}
                  {doctor.experience && (
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <HiClock className="w-5 h-5" />
                      <span>{doctor.experience} years experience</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability Status */}
              <div className={`px-4 py-2 rounded-xl text-center ${
                doctor.isAvailable
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
              }`}>
                <span className="font-medium">
                  {doctor.isAvailable ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button icon={HiCalendar}>
            Book Appointment
          </Button>
          {doctor.phone && (
            <Button
              variant="secondary"
              icon={HiPhone}
              onClick={() => window.open(`tel:${doctor.phone}`)}
            >
              Call
            </Button>
          )}
          {doctor.email && (
            <Button
              variant="secondary"
              icon={HiMail}
              onClick={() => window.open(`mailto:${doctor.email}`)}
            >
              Email
            </Button>
          )}
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* About */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {doctor.bio || `Dr. ${doctor.name} is a skilled ${doctor.specialty} with ${doctor.experience || 'several'} years of experience in providing excellent medical care.`}
          </p>
        </Card>

        {/* Hospital */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Works At
          </h2>
          {doctor.hospital ? (
            <Link
              to={`/hospitals/${doctor.hospital._id || doctor.hospital}`}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <HiOfficeBuilding className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {doctor.hospital.name || 'Hospital'}
                </p>
                <p className="text-sm text-gray-500">
                  {doctor.hospital.address?.city || 'View Details'}
                </p>
              </div>
            </Link>
          ) : (
            <p className="text-gray-500">No hospital affiliated</p>
          )}
        </Card>

        {/* Consultation Fee */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Consultation Fee
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              ₹{doctor.consultationFee || 500}
            </span>
            <span className="text-gray-500">per visit</span>
          </div>
        </Card>

        {/* Languages */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Languages
          </h2>
          <div className="flex flex-wrap gap-2">
            {(doctor.languages || ['English', 'Hindi']).map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {lang}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Weekly Schedule
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const schedule = doctor.schedule?.find(s => s.day === day);
            const isAvailable = schedule?.isAvailable;

            return (
              <div
                key={day}
                className={`p-3 rounded-lg text-center ${
                  isAvailable
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className={`font-medium text-sm mb-1 ${
                  isAvailable
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-500'
                }`}>
                  {day.slice(0, 3)}
                </p>
                {isAvailable && schedule ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {schedule.startTime} - {schedule.endTime}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Closed</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reviews Placeholder */}
      <Card className="text-center py-8">
        <HiStar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Reviews Coming Soon
        </h3>
        <p className="text-gray-500">
          Patient reviews and ratings will be available here
        </p>
      </Card>
    </div>
  );
};

export default DoctorDetails;

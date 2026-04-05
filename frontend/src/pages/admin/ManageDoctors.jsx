import { useState, useEffect } from 'react';
import {
  HiUserGroup,
  HiSearch,
  HiShieldCheck,
  HiX,
  HiEye,
  HiBadgeCheck,
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [pagination.page, filter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        verified: filter === 'verified' ? true : filter === 'pending' ? false : undefined,
      };
      const response = await adminAPI.getDoctors(params);
      if (response.data.success) {
        setDoctors(response.data.doctors || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Mock data
      setDoctors([
        { _id: '1', user: { name: 'Dr. Priya Sharma', email: 'priya@example.com', avatar: '' }, specialization: 'Cardiologist', hospital: { name: 'City General Hospital' }, isVerified: true, experience: 12 },
        { _id: '2', user: { name: 'Dr. Rajesh Kumar', email: 'rajesh@example.com', avatar: '' }, specialization: 'Neurologist', hospital: { name: 'Apollo Hospital' }, isVerified: true, experience: 8 },
        { _id: '3', user: { name: 'Dr. Aisha Patel', email: 'aisha@example.com', avatar: '' }, specialization: 'Pediatrician', hospital: { name: 'New Care Hospital' }, isVerified: false, experience: 5 },
        { _id: '4', user: { name: 'Dr. Vikram Singh', email: 'vikram@example.com', avatar: '' }, specialization: 'Orthopedic', hospital: { name: 'City General Hospital' }, isVerified: false, experience: 15 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId, verified) => {
    try {
      const response = await adminAPI.verifyDoctor(doctorId, { isVerified: verified });
      if (response.data.success) {
        toast.success(verified ? 'Doctor verified' : 'Verification revoked');
        fetchDoctors();
        setShowModal(false);
      }
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Doctors
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and verify registered doctors
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={HiSearch}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Doctors</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Verification</option>
          </select>
          <Button onClick={fetchDoctors} icon={HiSearch}>
            Search
          </Button>
        </div>
      </Card>

      {/* Doctors Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading text="Loading doctors..." />
        </div>
      ) : doctors.length === 0 ? (
        <Card className="text-center py-12">
          <HiUserGroup className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No doctors found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Card key={doctor._id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getInitials(doctor.user?.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                      {doctor.user?.name}
                      {doctor.isVerified && (
                        <HiBadgeCheck className="w-4 h-4 text-blue-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{doctor.specialization}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doctor.isVerified
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {doctor.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Hospital</span>
                  <span className="text-gray-900 dark:text-white">{doctor.hospital?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience</span>
                  <span className="text-gray-900 dark:text-white">{doctor.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900 dark:text-white truncate ml-2">{doctor.user?.email}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  icon={HiEye}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setShowModal(true);
                  }}
                >
                  View
                </Button>
                {!doctor.isVerified ? (
                  <Button
                    variant="success"
                    size="sm"
                    className="flex-1"
                    icon={HiShieldCheck}
                    onClick={() => handleVerify(doctor._id, true)}
                  >
                    Verify
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    icon={HiX}
                    onClick={() => handleVerify(doctor._id, false)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Doctor Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Doctor Details"
        size="lg"
      >
        {selectedDoctor && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {getInitials(selectedDoctor.user?.name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {selectedDoctor.user?.name}
                  {selectedDoctor.isVerified && (
                    <HiBadgeCheck className="w-5 h-5 text-blue-500" />
                  )}
                </h3>
                <p className="text-gray-500">{selectedDoctor.specialization}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hospital</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.hospital?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.experience} years</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${selectedDoctor.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {selectedDoctor.isVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              {!selectedDoctor.isVerified && (
                <Button
                  variant="success"
                  icon={HiShieldCheck}
                  onClick={() => handleVerify(selectedDoctor._id, true)}
                >
                  Verify Doctor
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageDoctors;

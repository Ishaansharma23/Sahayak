import { useState, useEffect } from 'react';
import {
  HiOfficeBuilding,
  HiSearch,
  HiShieldCheck,
  HiX,
  HiEye,
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const ManageHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, [pagination.page, filter]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        verified: filter === 'verified' ? true : filter === 'pending' ? false : undefined,
      };
      const response = await adminAPI.getHospitals(params);
      if (response.data.success) {
        setHospitals(response.data.hospitals || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      // Mock data
      setHospitals([
        { _id: '1', name: 'City General Hospital', address: { city: 'Mumbai', state: 'Maharashtra' }, isVerified: true, beds: { total: 200, available: 45 } },
        { _id: '2', name: 'Apollo Hospital', address: { city: 'Delhi', state: 'Delhi' }, isVerified: true, beds: { total: 500, available: 120 } },
        { _id: '3', name: 'New Care Hospital', address: { city: 'Bangalore', state: 'Karnataka' }, isVerified: false, beds: { total: 100, available: 30 } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (hospitalId, verified) => {
    try {
      const response = await adminAPI.verifyHospital(hospitalId, { isVerified: verified });
      if (response.data.success) {
        toast.success(verified ? 'Hospital verified' : 'Verification revoked');
        fetchHospitals();
        setShowModal(false);
      }
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Hospitals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and verify registered hospitals
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search hospitals..."
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
            <option value="all">All Hospitals</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Verification</option>
          </select>
          <Button onClick={fetchHospitals} icon={HiSearch}>
            Search
          </Button>
        </div>
      </Card>

      {/* Hospitals Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading text="Loading hospitals..." />
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-12">
            <HiOfficeBuilding className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hospitals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beds</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {hospitals.map((hospital) => (
                  <tr key={hospital._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <HiOfficeBuilding className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {hospital.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {hospital.address?.city}, {hospital.address?.state}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {hospital.beds?.available || 0} / {hospital.beds?.total || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        hospital.isVerified
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {hospital.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedHospital(hospital);
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <HiEye className="w-4 h-4 text-gray-500" />
                        </button>
                        {!hospital.isVerified ? (
                          <button
                            onClick={() => handleVerify(hospital._id, true)}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                          >
                            <HiShieldCheck className="w-4 h-4 text-green-500" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(hospital._id, false)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <HiX className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Hospital Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Hospital Details"
        size="lg"
      >
        {selectedHospital && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedHospital.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedHospital.address?.city}, {selectedHospital.address?.state}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Beds</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedHospital.beds?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Beds</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedHospital.beds?.available || 0}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              {!selectedHospital.isVerified && (
                <Button
                  variant="success"
                  icon={HiShieldCheck}
                  onClick={() => handleVerify(selectedHospital._id, true)}
                >
                  Verify Hospital
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageHospitals;

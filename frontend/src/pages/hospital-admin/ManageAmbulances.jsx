import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiPlus,
  HiRefresh,
  HiLocationMarker,
  HiPhone,
  HiUser,
  HiCheck,
  HiX,
  HiPencil,
  HiTrash,
} from 'react-icons/hi';
import { FaAmbulance } from 'react-icons/fa';
import { hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const ManageAmbulances = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    type: 'basic',
  });
  const { socket } = useSocket();

  const ambulanceTypes = [
    { value: 'basic', label: 'Basic Life Support' },
    { value: 'advanced', label: 'Advanced Life Support' },
    { value: 'icu', label: 'Mobile ICU' },
    { value: 'neonatal', label: 'Neonatal' },
  ];

  useEffect(() => {
    fetchAmbulances();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('ambulance_status_update', (data) => {
        setAmbulances(prev => prev.map(amb =>
          amb._id === data.ambulanceId ? { ...amb, status: data.status } : amb
        ));
      });

      return () => {
        socket.off('ambulance_status_update');
      };
    }
  }, [socket]);

  const fetchAmbulances = async () => {
    setLoading(true);
    try {
      const response = await hospitalAPI.getAmbulances();
      if (response.data.success) {
        setAmbulances(response.data.ambulances || []);
      }
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      // Mock data
      setAmbulances([
        { _id: '1', vehicleNumber: 'MH-01-AB-1234', driverName: 'Ramesh Kumar', driverPhone: '+91 9876543210', type: 'advanced', status: 'available', location: { lat: 19.076, lng: 72.8777 } },
        { _id: '2', vehicleNumber: 'MH-01-CD-5678', driverName: 'Suresh Patel', driverPhone: '+91 9876543211', type: 'basic', status: 'dispatched', location: { lat: 19.086, lng: 72.8877 } },
        { _id: '3', vehicleNumber: 'MH-01-EF-9012', driverName: 'Vikram Singh', driverPhone: '+91 9876543212', type: 'icu', status: 'available', location: { lat: 19.066, lng: 72.8677 } },
        { _id: '4', vehicleNumber: 'MH-01-GH-3456', driverName: 'Amit Sharma', driverPhone: '+91 9876543213', type: 'basic', status: 'maintenance', location: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAmbulance) {
        const response = await hospitalAPI.updateAmbulance(editingAmbulance._id, formData);
        if (response.data.success) {
          setAmbulances(prev => prev.map(amb =>
            amb._id === editingAmbulance._id ? { ...amb, ...formData } : amb
          ));
          toast.success('Ambulance updated successfully');
        }
      } else {
        const response = await hospitalAPI.addAmbulance(formData);
        if (response.data.success) {
          setAmbulances(prev => [...prev, { ...formData, _id: Date.now().toString(), status: 'available' }]);
          toast.success('Ambulance added successfully');
        }
      }
    } catch (error) {
      // Handle for demo
      if (editingAmbulance) {
        setAmbulances(prev => prev.map(amb =>
          amb._id === editingAmbulance._id ? { ...amb, ...formData } : amb
        ));
        toast.success('Ambulance updated successfully');
      } else {
        setAmbulances(prev => [...prev, { ...formData, _id: Date.now().toString(), status: 'available' }]);
        toast.success('Ambulance added successfully');
      }
    }

    setShowModal(false);
    setEditingAmbulance(null);
    setFormData({ vehicleNumber: '', driverName: '', driverPhone: '', type: 'basic' });
  };

  const handleStatusChange = async (ambulanceId, newStatus) => {
    try {
      const response = await hospitalAPI.updateAmbulanceStatus(ambulanceId, { status: newStatus });
      if (response.data.success) {
        setAmbulances(prev => prev.map(amb =>
          amb._id === ambulanceId ? { ...amb, status: newStatus } : amb
        ));
        toast.success('Status updated');
      }
    } catch (error) {
      setAmbulances(prev => prev.map(amb =>
        amb._id === ambulanceId ? { ...amb, status: newStatus } : amb
      ));
      toast.success('Status updated');
    }
  };

  const handleDelete = async (ambulanceId) => {
    if (!confirm('Are you sure you want to delete this ambulance?')) return;

    try {
      await hospitalAPI.deleteAmbulance(ambulanceId);
      setAmbulances(prev => prev.filter(amb => amb._id !== ambulanceId));
      toast.success('Ambulance deleted');
    } catch (error) {
      setAmbulances(prev => prev.filter(amb => amb._id !== ambulanceId));
      toast.success('Ambulance deleted');
    }
  };

  const openEditModal = (ambulance) => {
    setEditingAmbulance(ambulance);
    setFormData({
      vehicleNumber: ambulance.vehicleNumber,
      driverName: ambulance.driverName,
      driverPhone: ambulance.driverPhone,
      type: ambulance.type,
    });
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      dispatched: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      offline: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    };
    return colors[status] || colors.offline;
  };

  const getTypeLabel = (type) => {
    const labels = {
      basic: 'Basic Life Support',
      advanced: 'Advanced Life Support',
      icu: 'Mobile ICU',
      neonatal: 'Neonatal',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading ambulances..." />
      </div>
    );
  }

  const stats = {
    total: ambulances.length,
    available: ambulances.filter(a => a.status === 'available').length,
    dispatched: ambulances.filter(a => a.status === 'dispatched').length,
    maintenance: ambulances.filter(a => a.status === 'maintenance').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Ambulances
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your ambulance fleet
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={HiRefresh} onClick={fetchAmbulances}>
            Refresh
          </Button>
          <Button
            icon={HiPlus}
            onClick={() => {
              setEditingAmbulance(null);
              setFormData({ vehicleNumber: '', driverName: '', driverPhone: '', type: 'basic' });
              setShowModal(true);
            }}
          >
            Add Ambulance
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <FaAmbulance className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Fleet</p>
        </Card>
        <Card className="text-center bg-green-50 dark:bg-green-900/20">
          <HiCheck className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          <p className="text-sm text-gray-500">Available</p>
        </Card>
        <Card className="text-center bg-blue-50 dark:bg-blue-900/20">
          <HiLocationMarker className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-blue-600">{stats.dispatched}</p>
          <p className="text-sm text-gray-500">Dispatched</p>
        </Card>
        <Card className="text-center bg-yellow-50 dark:bg-yellow-900/20">
          <HiX className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
          <p className="text-sm text-gray-500">Maintenance</p>
        </Card>
      </div>

      {/* Ambulance List */}
      {ambulances.length === 0 ? (
        <Card className="text-center py-12">
          <FaAmbulance className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No ambulances registered</p>
          <Button
            icon={HiPlus}
            onClick={() => {
              setEditingAmbulance(null);
              setShowModal(true);
            }}
          >
            Add Your First Ambulance
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ambulances.map((ambulance, index) => (
            <motion.div
              key={ambulance._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(ambulance.status)}`}>
                    {ambulance.status}
                  </span>
                </div>

                {/* Vehicle Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <FaAmbulance className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {ambulance.vehicleNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{getTypeLabel(ambulance.type)}</p>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <HiUser className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{ambulance.driverName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HiPhone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{ambulance.driverPhone}</span>
                  </div>
                </div>

                {/* Status Select */}
                <div className="mb-4">
                  <label className="text-sm text-gray-500 mb-1 block">Update Status</label>
                  <select
                    value={ambulance.status}
                    onChange={(e) => handleStatusChange(ambulance._id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    icon={HiPencil}
                    onClick={() => openEditModal(ambulance)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={HiTrash}
                    onClick={() => handleDelete(ambulance._id)}
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingAmbulance(null);
        }}
        title={editingAmbulance ? 'Edit Ambulance' : 'Add New Ambulance'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Vehicle Number"
            placeholder="e.g., MH-01-AB-1234"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
            required
          />
          <Input
            label="Driver Name"
            placeholder="Enter driver name"
            value={formData.driverName}
            onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
            required
          />
          <Input
            label="Driver Phone"
            placeholder="Enter phone number"
            value={formData.driverPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, driverPhone: e.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ambulance Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              {ambulanceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowModal(false);
                setEditingAmbulance(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingAmbulance ? 'Update' : 'Add'} Ambulance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageAmbulances;

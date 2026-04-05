import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiCalendar,
  HiClock,
  HiPlus,
  HiTrash,
  HiCheck,
  HiX,
  HiRefresh,
} from 'react-icons/hi';
import { doctorAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const ManageSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    day: 'monday',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    maxPatients: 20,
  });

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await doctorAPI.getSchedule();
      if (response.data.success) {
        setSchedule(response.data.schedule || []);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Mock data
      setSchedule([
        { _id: '1', day: 'monday', startTime: '09:00', endTime: '13:00', slotDuration: 30, maxPatients: 8, isActive: true },
        { _id: '2', day: 'monday', startTime: '15:00', endTime: '19:00', slotDuration: 30, maxPatients: 8, isActive: true },
        { _id: '3', day: 'tuesday', startTime: '10:00', endTime: '14:00', slotDuration: 30, maxPatients: 8, isActive: true },
        { _id: '4', day: 'wednesday', startTime: '09:00', endTime: '17:00', slotDuration: 30, maxPatients: 16, isActive: true },
        { _id: '5', day: 'thursday', startTime: '09:00', endTime: '13:00', slotDuration: 30, maxPatients: 8, isActive: true },
        { _id: '6', day: 'friday', startTime: '10:00', endTime: '16:00', slotDuration: 30, maxPatients: 12, isActive: true },
        { _id: '7', day: 'saturday', startTime: '10:00', endTime: '14:00', slotDuration: 30, maxPatients: 8, isActive: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSlot) {
        const response = await doctorAPI.updateSchedule(editingSlot._id, formData);
        if (response.data.success) {
          setSchedule(prev => prev.map(slot =>
            slot._id === editingSlot._id ? { ...slot, ...formData } : slot
          ));
          toast.success('Schedule updated');
        }
      } else {
        const response = await doctorAPI.addScheduleSlot(formData);
        if (response.data.success) {
          setSchedule(prev => [...prev, { ...formData, _id: Date.now().toString(), isActive: true }]);
          toast.success('Schedule slot added');
        }
      }
    } catch (error) {
      // Handle for demo
      if (editingSlot) {
        setSchedule(prev => prev.map(slot =>
          slot._id === editingSlot._id ? { ...slot, ...formData } : slot
        ));
        toast.success('Schedule updated');
      } else {
        setSchedule(prev => [...prev, { ...formData, _id: Date.now().toString(), isActive: true }]);
        toast.success('Schedule slot added');
      }
    }

    setShowModal(false);
    setEditingSlot(null);
    setFormData({ day: 'monday', startTime: '09:00', endTime: '17:00', slotDuration: 30, maxPatients: 20 });
  };

  const handleToggleStatus = async (slotId, isActive) => {
    try {
      await doctorAPI.updateSchedule(slotId, { isActive: !isActive });
      setSchedule(prev => prev.map(slot =>
        slot._id === slotId ? { ...slot, isActive: !isActive } : slot
      ));
      toast.success(isActive ? 'Slot deactivated' : 'Slot activated');
    } catch (error) {
      setSchedule(prev => prev.map(slot =>
        slot._id === slotId ? { ...slot, isActive: !isActive } : slot
      ));
      toast.success(isActive ? 'Slot deactivated' : 'Slot activated');
    }
  };

  const handleDelete = async (slotId) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;

    try {
      await doctorAPI.deleteScheduleSlot(slotId);
      setSchedule(prev => prev.filter(slot => slot._id !== slotId));
      toast.success('Slot deleted');
    } catch (error) {
      setSchedule(prev => prev.filter(slot => slot._id !== slotId));
      toast.success('Slot deleted');
    }
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setFormData({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDuration: slot.slotDuration,
      maxPatients: slot.maxPatients,
    });
    setShowModal(true);
  };

  const getScheduleForDay = (day) => {
    return schedule.filter(slot => slot.day === day);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading schedule..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set your availability for patient appointments
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={HiRefresh} onClick={fetchSchedule}>
            Refresh
          </Button>
          <Button
            icon={HiPlus}
            onClick={() => {
              setEditingSlot(null);
              setFormData({ day: 'monday', startTime: '09:00', endTime: '17:00', slotDuration: 30, maxPatients: 20 });
              setShowModal(true);
            }}
          >
            Add Slot
          </Button>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {days.map((day, index) => {
          const daySchedule = getScheduleForDay(day.key);
          const hasSlots = daySchedule.length > 0;

          return (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={!hasSlots ? 'opacity-60' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {day.label}
                  </h3>
                  <span className={`w-2 h-2 rounded-full ${
                    hasSlots && daySchedule.some(s => s.isActive)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`} />
                </div>

                {!hasSlots ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">No slots</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={HiPlus}
                      onClick={() => {
                        setEditingSlot(null);
                        setFormData(prev => ({ ...prev, day: day.key }));
                        setShowModal(true);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {daySchedule.map((slot) => (
                      <div
                        key={slot._id}
                        className={`p-3 rounded-lg border ${
                          slot.isActive
                            ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                            : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <HiClock className={`w-4 h-4 ${slot.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${slot.isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleStatus(slot._id, slot.isActive)}
                            className={`p-1 rounded ${slot.isActive ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            {slot.isActive ? <HiCheck className="w-4 h-4" /> : <HiX className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{slot.slotDuration} min slots</span>
                          <span>{slot.maxPatients} max patients</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => openEditModal(slot)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(slot._id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={HiPlus}
                      className="w-full"
                      onClick={() => {
                        setEditingSlot(null);
                        setFormData(prev => ({ ...prev, day: day.key }));
                        setShowModal(true);
                      }}
                    >
                      Add Slot
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <HiCalendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                Weekly Summary
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {schedule.filter(s => s.isActive).length} active slots across {
                  new Set(schedule.filter(s => s.isActive).map(s => s.day)).size
                } days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-300">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-gray-600 dark:text-gray-300">Inactive</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSlot(null);
        }}
        title={editingSlot ? 'Edit Schedule Slot' : 'Add Schedule Slot'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Day
            </label>
            <select
              value={formData.day}
              onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              {days.map(day => (
                <option key={day.key} value={day.key}>{day.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slot Duration (minutes)
              </label>
              <select
                value={formData.slotDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Patients
              </label>
              <input
                type="number"
                value={formData.maxPatients}
                onChange={(e) => setFormData(prev => ({ ...prev, maxPatients: parseInt(e.target.value) }))}
                min={1}
                max={50}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowModal(false);
                setEditingSlot(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingSlot ? 'Update' : 'Add'} Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageSchedule;

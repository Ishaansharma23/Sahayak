import { useEffect, useState } from 'react';
import { HiCheckCircle, HiMinus, HiPlus, HiRefresh } from 'react-icons/hi';
import { FaAmbulance } from 'react-icons/fa';
import { hospitalAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const ManageAmbulances = () => {
  const { user } = useAuth();
  const [ambulances, setAmbulances] = useState({ total: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [customAvailable, setCustomAvailable] = useState('');

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const fetchAmbulances = async () => {
    setLoading(true);
    try {
      const hospitalId = user?.hospitalProfile?._id || user?.hospitalProfile || user?.hospital;
      if (!hospitalId) {
        throw new Error('Hospital profile is missing for this account');
      }

      const response = await hospitalAPI.getStats(hospitalId);
      if (response.data.success) {
        const stats = response.data.stats?.ambulances || { total: 0, available: 0 };
        setAmbulances({
          total: stats.total || 0,
          available: stats.available || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      setAmbulances({ total: 0, available: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateAvailable = async (value) => {
    const total = ambulances.total || 0;
    const nextAvailable = Math.min(Math.max(value, 0), total);

    const hospitalId = user?.hospitalProfile?._id || user?.hospitalProfile || user?.hospital;
    if (!hospitalId) {
      toast.error('Hospital profile is missing');
      return;
    }

    setUpdating(true);
    try {
      const response = await hospitalAPI.updateAmbulances(hospitalId, { available: nextAvailable });
      if (response.data.success) {
        setAmbulances((prev) => ({ ...prev, available: nextAvailable }));
        toast.success('Ambulance availability updated');
      }
    } catch (error) {
      console.error('Ambulance update error:', error);
      toast.error('Failed to update ambulances');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading ambulances..." />
      </div>
    );
  }

  const inUse = Math.max(ambulances.total - ambulances.available, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Ambulances
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update ambulance availability in real-time
          </p>
        </div>
        <Button variant="secondary" icon={HiRefresh} onClick={fetchAmbulances}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Total Ambulances</p>
              <p className="text-4xl font-bold mt-1">{ambulances.total}</p>
            </div>
            <FaAmbulance className="w-12 h-12 text-white/50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Available</p>
              <p className="text-4xl font-bold mt-1">{ambulances.available}</p>
            </div>
            <HiCheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">In Use</p>
              <p className="text-4xl font-bold mt-1">{inUse}</p>
            </div>
            <FaAmbulance className="w-12 h-12 text-orange-200" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Update Availability
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Keep the available ambulance count accurate for emergency dispatches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={HiMinus}
              disabled={updating || ambulances.available <= 0}
              onClick={() => updateAvailable(ambulances.available - 1)}
            />
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              {ambulances.available}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={HiPlus}
              disabled={updating || ambulances.available >= ambulances.total}
              onClick={() => updateAvailable(ambulances.available + 1)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <Input
            label="Set Exact Available Count"
            type="number"
            value={customAvailable}
            onChange={(e) => setCustomAvailable(e.target.value)}
            placeholder="Enter number"
          />
          <Button
            className="md:self-end"
            disabled={updating || customAvailable === ''}
            onClick={() => updateAvailable(Number(customAvailable))}
          >
            Update Count
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ManageAmbulances;

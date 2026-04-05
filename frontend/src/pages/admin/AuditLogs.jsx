import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  HiClipboardList,
  HiSearch,
  HiFilter,
  HiDownload,
  HiUser,
  HiOfficeBuilding,
  HiExclamationCircle,
  HiShieldCheck,
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      };
      const response = await adminAPI.getAuditLogs(params);
      if (response.data.success) {
        setLogs(response.data.logs || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      // Mock data
      const mockLogs = [
        { _id: '1', action: 'user_login', user: { name: 'Admin User', email: 'admin@example.com' }, details: { ip: '192.168.1.1' }, createdAt: new Date().toISOString() },
        { _id: '2', action: 'hospital_verified', user: { name: 'Admin User', email: 'admin@example.com' }, details: { hospital: 'City General Hospital' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { _id: '3', action: 'sos_triggered', user: { name: 'Priya Sharma', email: 'priya@example.com' }, details: { location: 'Mumbai, Maharashtra' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { _id: '4', action: 'emergency_created', user: { name: 'Raj Kumar', email: 'raj@example.com' }, details: { type: 'Medical Emergency' }, createdAt: new Date(Date.now() - 10800000).toISOString() },
        { _id: '5', action: 'user_created', user: { name: 'System', email: 'system@lifeline.com' }, details: { newUser: 'new_user@example.com' }, createdAt: new Date(Date.now() - 14400000).toISOString() },
        { _id: '6', action: 'doctor_verified', user: { name: 'Admin User', email: 'admin@example.com' }, details: { doctor: 'Dr. Aisha Patel' }, createdAt: new Date(Date.now() - 18000000).toISOString() },
        { _id: '7', action: 'bed_updated', user: { name: 'Hospital Admin', email: 'hospital@example.com' }, details: { bedType: 'ICU', change: '+5' }, createdAt: new Date(Date.now() - 21600000).toISOString() },
        { _id: '8', action: 'ambulance_dispatched', user: { name: 'System', email: 'system@lifeline.com' }, details: { destination: 'Delhi, India' }, createdAt: new Date(Date.now() - 25200000).toISOString() },
      ];
      setLogs(mockLogs);
      setPagination(prev => ({ ...prev, total: mockLogs.length }));
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      user_login: HiUser,
      user_created: HiUser,
      hospital_verified: HiOfficeBuilding,
      doctor_verified: HiShieldCheck,
      sos_triggered: HiExclamationCircle,
      emergency_created: HiExclamationCircle,
      bed_updated: HiOfficeBuilding,
      ambulance_dispatched: HiOfficeBuilding,
    };
    const Icon = icons[action] || HiClipboardList;
    return Icon;
  };

  const getActionColor = (action) => {
    const colors = {
      user_login: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      user_created: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      hospital_verified: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      doctor_verified: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      sos_triggered: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      emergency_created: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      bed_updated: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
      ambulance_dispatched: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return colors[action] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  const formatAction = (action) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleExport = () => {
    // Export logs as CSV
    const csvContent = [
      ['Date', 'Action', 'User', 'Email', 'Details'].join(','),
      ...logs.map(log => [
        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.user?.name || 'System',
        log.user?.email || '',
        JSON.stringify(log.details || {}),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            System activity and security logs
          </p>
        </div>
        <Button icon={HiDownload} onClick={handleExport}>
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={HiSearch}
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Actions</option>
            <option value="user_login">User Login</option>
            <option value="user_created">User Created</option>
            <option value="hospital_verified">Hospital Verified</option>
            <option value="doctor_verified">Doctor Verified</option>
            <option value="sos_triggered">SOS Triggered</option>
            <option value="emergency_created">Emergency Created</option>
            <option value="bed_updated">Bed Updated</option>
            <option value="ambulance_dispatched">Ambulance Dispatched</option>
          </select>
          <Button variant="secondary" icon={HiFilter} onClick={fetchLogs}>
            Apply
          </Button>
        </div>
      </Card>

      {/* Logs Timeline */}
      <Card padding="none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading text="Loading audit logs..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <HiClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => {
              const Icon = getActionIcon(log.action);
              return (
                <div
                  key={log._id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(log.action)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatAction(log.action)}
                        </p>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        By {log.user?.name || 'System'} ({log.user?.email || 'system@lifeline.com'})
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(log.details).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;

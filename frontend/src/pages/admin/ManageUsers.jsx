import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiUserGroup,
  HiSearch,
  HiFilter,
  HiPencil,
  HiTrash,
  HiShieldCheck,
  HiMail,
  HiPhone,
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const roles = ['client', 'doctor', 'hospital', 'admin'];

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        accountType: selectedRole,
      };
      const response = await adminAPI.getUsers(params);
      if (response.data.success) {
        setUsers(response.data.users || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock data for demo
      setUsers([
        { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '9876543210', accountType: 'client', isActive: true },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '9876543211', accountType: 'hospital', isActive: true },
        { _id: '3', name: 'Dr. Wilson', email: 'wilson@example.com', phone: '9876543212', accountType: 'doctor', isActive: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleUpdateUserRole = async (userId, accountType) => {
    try {
      const response = await adminAPI.updateUserRole(userId, { accountType });
      if (response.data.success) {
        toast.success('User account type updated');
        fetchUsers();
        setShowEditModal(false);
      }
    } catch (error) {
      toast.error('Failed to update account type');
      console.error('Update error:', error);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!user?._id) return;
    try {
      const response = await adminAPI.toggleUserStatus(user._id);
      if (response.data.success) {
        toast.success('User status updated');
        fetchUsers();
        setShowEditModal(false);
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Status update error:', error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      client: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      hospital: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      doctor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[role] || colors.client;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage all registered users
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={HiSearch}
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
          <Button type="submit" icon={HiSearch}>
            Search
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading text="Loading users..." />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <HiUserGroup className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">{user._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white flex items-center gap-1">
                          <HiMail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </p>
                        <p className="text-gray-500 flex items-center gap-1">
                          <HiPhone className="w-4 h-4 text-gray-400" />
                          {user.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.accountType)}`}>
                        {user.accountType?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <HiPencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive
                              ? 'hover:bg-red-100 dark:hover:bg-red-900/30'
                              : 'hover:bg-green-100 dark:hover:bg-green-900/30'
                          }`}
                        >
                          <HiShieldCheck className={`w-4 h-4 ${
                            user.isActive ? 'text-red-500' : 'text-green-500'
                          }`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} users
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
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={selectedUser.name}
              disabled
            />
            <Input
              label="Email"
              type="email"
              value={selectedUser.email}
              disabled
            />
            <Input
              label="Phone"
              value={selectedUser.phone}
              disabled
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={selectedUser.accountType}
                onChange={(e) => setSelectedUser(prev => ({ ...prev, accountType: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateUserRole(selectedUser._id, selectedUser.accountType)}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageUsers;

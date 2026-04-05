import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiUser,
  HiMail,
  HiPhone,
  HiLockClosed,
  HiLocationMarker,
  HiUsers,
  HiPencil,
  HiTrash,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relation: '',
  });

  const handleProfileChange = (e) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleContactChange = (e) => {
    setNewContact(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(profileData);
    setLoading(false);
    if (result.success) {
      toast.success('Profile updated successfully');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
    setLoading(false);

    if (result.success) {
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    // In real app, this would call API
    toast.success('Emergency contact added');
    setShowContactModal(false);
    setNewContact({ name: '', phone: '', relation: '' });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: HiUser },
    { id: 'security', label: 'Security', icon: HiLockClosed },
    { id: 'emergency', label: 'Emergency Contacts', icon: HiUsers },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user?.name}
        </h1>
        <p className="text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="profileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <Card>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                icon={HiUser}
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                icon={HiMail}
                disabled
                helperText="Email cannot be changed"
              />
              <Input
                label="Phone Number"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                icon={HiPhone}
              />
              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Security Settings
            </h2>
            
            <div className="space-y-4">
              {/* Password */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <HiLockClosed className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Password
                    </p>
                    <p className="text-sm text-gray-500">
                      Change your account password
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change
                </Button>
              </div>

              {/* Two-Factor */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <HiLockClosed className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-gray-500">
                      Add extra security to your account
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'emergency' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Emergency Contacts
              </h2>
              <Button
                size="sm"
                onClick={() => setShowContactModal(true)}
              >
                Add Contact
              </Button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              These contacts will be notified when you trigger an SOS alert.
            </p>

            <div className="space-y-3">
              {(user?.emergencyContacts || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HiUsers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No emergency contacts added yet</p>
                </div>
              ) : (
                user.emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {contact.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contact.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {contact.phone} • {contact.relation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                        <HiPencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <HiTrash className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Change Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Add Emergency Contact"
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={newContact.name}
            onChange={handleContactChange}
            required
          />
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={newContact.phone}
            onChange={handleContactChange}
            required
          />
          <Input
            label="Relation"
            name="relation"
            value={newContact.relation}
            onChange={handleContactChange}
            placeholder="e.g., Father, Friend, Spouse"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowContactModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;

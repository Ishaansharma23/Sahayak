import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Hospitals from './pages/hospitals/Hospitals';
import HospitalDetails from './pages/hospitals/HospitalDetails';
import Doctors from './pages/doctors/Doctors';
import DoctorDetails from './pages/doctors/DoctorDetails';
import Emergency from './pages/emergency/Emergency';
import EmergencyTrack from './pages/emergency/EmergencyTrack';
import SOS from './pages/sos/SOS';
import Profile from './pages/Profile';

// Hospital Admin Pages
import HospitalDashboard from './pages/hospital-admin/HospitalDashboard';
import ManageBeds from './pages/hospital-admin/ManageBeds';
import ManageAmbulances from './pages/hospital-admin/ManageAmbulances';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ManageSchedule from './pages/doctor/ManageSchedule';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageHospitals from './pages/admin/ManageHospitals';
import ManageDoctors from './pages/admin/ManageDoctors';
import AuditLogs from './pages/admin/AuditLogs';

// Components
import Loading from './components/common/Loading';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
      </Route>

      {/* Protected User Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/hospitals/:id" element={<HospitalDetails />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/emergency/:id" element={<EmergencyTrack />} />
        <Route path="/sos" element={<SOS />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Hospital Admin Routes */}
      <Route
        element={
          <ProtectedRoute roles={['hospital_admin', 'super_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/hospital-admin" element={<HospitalDashboard />} />
        <Route path="/hospital-admin/beds" element={<ManageBeds />} />
        <Route path="/hospital-admin/ambulances" element={<ManageAmbulances />} />
      </Route>

      {/* Doctor Routes */}
      <Route
        element={
          <ProtectedRoute roles={['doctor', 'super_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/schedule" element={<ManageSchedule />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute roles={['super_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/hospitals" element={<ManageHospitals />} />
        <Route path="/admin/doctors" element={<ManageDoctors />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

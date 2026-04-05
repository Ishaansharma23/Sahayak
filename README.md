# LifeLine - Real-Time Emergency Hospital & Women Safety Network

<p align="center">
  <img src="frontend/public/logo.svg" alt="LifeLine Logo" width="120" height="120">
</p>

<p align="center">
  <strong>🏥 Emergency Healthcare | 🚑 Ambulance Services | 🆘 Women Safety SOS</strong>
</p>

<p align="center">
  A comprehensive full-stack web application providing real-time hospital bed availability, emergency ambulance dispatch, and women safety SOS features with live location tracking.
</p>

---

## 🌟 Features

### For Users
- **🏥 Hospital Finder** - Search nearby hospitals with real-time bed availability
- **👨‍⚕️ Doctor Discovery** - Find doctors by specialization, book appointments
- **🚑 Emergency Ambulance** - Request ambulance with live tracking
- **🆘 Women Safety SOS** - One-tap emergency alert with live location sharing
- **📍 Live Location Tracking** - Real-time ambulance and emergency responder tracking
- **🔔 Real-time Notifications** - Instant updates via Socket.IO

### For Hospital Admins
- **📊 Hospital Dashboard** - Overview of beds, ambulances, and emergencies
- **🛏️ Bed Management** - Real-time bed availability updates
- **🚑 Ambulance Fleet Management** - Track and dispatch ambulances
- **📈 Analytics & Reports** - Hospital performance metrics

### For Doctors
- **📅 Schedule Management** - Set availability and manage appointments
- **👥 Patient Management** - View patient history and appointments
- **📞 Telemedicine Support** - Video consultations (integration ready)

### For Super Admins
- **👥 User Management** - Manage all users across the platform
- **🏥 Hospital Verification** - Verify and manage registered hospitals
- **👨‍⚕️ Doctor Verification** - Verify medical professionals
- **📋 Audit Logs** - Complete system activity tracking

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM |
| **Socket.IO** | Real-time communication |
| **JWT** | Authentication (HTTP-only cookies) |
| **bcryptjs** | Password hashing |
| **Redis** | Caching (optional) |
| **Cloudinary** | Image uploads (optional) |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Library |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **React Router v6** | Routing |
| **Axios** | HTTP client |
| **Socket.IO Client** | Real-time updates |
| **Leaflet** | Maps |
| **Chart.js** | Analytics charts |
| **React Hot Toast** | Notifications |

---

## 📁 Project Structure

```
LifeLine/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── hospitalController.js
│   │   ├── doctorController.js
│   │   ├── emergencyController.js
│   │   ├── sosController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── roleAuth.js        # Role-based access
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Hospital.js
│   │   ├── Doctor.js
│   │   ├── Emergency.js
│   │   ├── SOSAlert.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── hospitalRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── emergencyRoutes.js
│   │   ├── sosRoutes.js
│   │   └── adminRoutes.js
│   ├── socket/
│   │   └── socketHandler.js   # Socket.IO events
│   ├── utils/
│   │   └── helpers.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── logo.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   └── Modal.jsx
│   │   │   └── layout/
│   │   │       ├── MainLayout.jsx
│   │   │       └── DashboardLayout.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── hospitals/
│   │   │   │   ├── Hospitals.jsx
│   │   │   │   └── HospitalDetails.jsx
│   │   │   ├── doctors/
│   │   │   │   ├── Doctors.jsx
│   │   │   │   └── DoctorDetails.jsx
│   │   │   ├── emergency/
│   │   │   │   ├── Emergency.jsx
│   │   │   │   └── EmergencyTrack.jsx
│   │   │   ├── sos/
│   │   │   │   └── SOS.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ManageUsers.jsx
│   │   │   │   ├── ManageHospitals.jsx
│   │   │   │   ├── ManageDoctors.jsx
│   │   │   │   └── AuditLogs.jsx
│   │   │   ├── hospital-admin/
│   │   │   │   ├── HospitalDashboard.jsx
│   │   │   │   ├── ManageBeds.jsx
│   │   │   │   └── ManageAmbulances.jsx
│   │   │   └── doctor/
│   │   │       ├── DoctorDashboard.jsx
│   │   │       └── ManageSchedule.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/lifeline.git
cd lifeline
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your MongoDB URI, JWT secret, etc.
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
```

4. **Environment Variables**

Create `backend/.env`:
```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lifeline

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Optional: Redis
REDIS_URL=redis://localhost:6379

# Optional: Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Application

1. **Start Backend Server**
```bash
cd backend
npm run dev
```

2. **Start Frontend Development Server**
```bash
cd frontend
npm run dev
```

3. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update-profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospitals` | List all hospitals |
| GET | `/api/hospitals/:id` | Get hospital details |
| GET | `/api/hospitals/nearby` | Find nearby hospitals |
| PUT | `/api/hospitals/beds` | Update bed availability |
| PUT | `/api/hospitals/ambulances` | Manage ambulances |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors |
| GET | `/api/doctors/:id` | Get doctor details |
| GET | `/api/doctors/schedule/:id` | Get doctor schedule |
| PUT | `/api/doctors/schedule` | Update schedule |

### Emergency
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency` | Create emergency request |
| GET | `/api/emergency/:id` | Get emergency details |
| PUT | `/api/emergency/:id/status` | Update status |
| GET | `/api/emergency/active` | Get active emergencies |

### SOS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sos/trigger` | Trigger SOS alert |
| PUT | `/api/sos/:id/cancel` | Cancel SOS |
| PUT | `/api/sos/:id/safe` | Mark as safe |
| GET | `/api/sos/active` | Get active alerts |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:id` | Update user |
| GET | `/api/admin/hospitals` | List hospitals for verification |
| PUT | `/api/admin/hospitals/:id/verify` | Verify hospital |
| GET | `/api/admin/audit-logs` | Get audit logs |

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ room: string }` | Join a socket room |
| `leave_room` | `{ room: string }` | Leave a socket room |
| `trigger_sos` | `{ location, userId }` | Trigger SOS alert |
| `cancel_sos` | `{ alertId }` | Cancel SOS alert |
| `update_location` | `{ lat, lng }` | Update user location |
| `emergency_update` | `{ emergencyId, status }` | Update emergency status |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `sos_alert` | `SOSAlert object` | New SOS alert notification |
| `sos_cancelled` | `{ alertId }` | SOS cancellation |
| `emergency_status_update` | `Emergency object` | Emergency status change |
| `bed_update` | `{ hospitalId, beds }` | Bed availability update |
| `ambulance_dispatched` | `Ambulance object` | Ambulance dispatch notification |
| `location_update` | `{ userId, location }` | Real-time location update |

---

## 👥 User Roles

| Role | Access Level |
|------|-------------|
| `user` | Basic user - can search hospitals, request ambulance, trigger SOS |
| `doctor` | Doctor - manage schedule, view appointments, respond to emergencies |
| `hospital_admin` | Hospital admin - manage beds, ambulances, view hospital emergencies |
| `super_admin` | System admin - full access to all features, user/hospital verification |

---

## 🎨 UI Features

- **Responsive Design** - Mobile-first, works on all devices
- **Dark Mode** - System preference detection + manual toggle
- **Animations** - Smooth transitions with Framer Motion
- **Real-time Updates** - Live data with Socket.IO
- **Interactive Maps** - Leaflet for location features
- **Toast Notifications** - User feedback with react-hot-toast

---

## 🔒 Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Audit logging

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 📦 Deployment

### Backend (Node.js)
```bash
cd backend
npm run build
npm start
```

### Frontend (Static)
```bash
cd frontend
npm run build
# Deploy dist/ folder to CDN or static host
```

### Docker (Coming Soon)
```bash
docker-compose up -d
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com) for the amazing utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Socket.IO](https://socket.io) for real-time communication
- [Leaflet](https://leafletjs.com) for interactive maps
- [React Icons](https://react-icons.github.io/react-icons/) for beautiful icons

---

<p align="center">
  Made with ❤️ for emergency healthcare accessibility
</p>

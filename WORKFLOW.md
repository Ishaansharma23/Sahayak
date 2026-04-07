# LifeLine Project Workflow (Frontend -> Backend)

Date: 7 April 2026

This document explains how requests flow through the frontend, backend, routes, and data models.

## 1) High-level Architecture

- Frontend: React + Vite + Tailwind + Framer Motion
- Backend: Node.js + Express + Mongoose + JWT + Socket.IO
- Database: MongoDB
- Real-time: Socket.IO (server emits events, client listens)

## 2) Frontend Flow

### 2.1 Routing (React Router)
- Public pages: Home, Hospitals, Doctors, Emergency, SOS, Login, Register
- Protected pages: Dashboard, Profile (requires auth)
- Staff-only areas (ProtectedRoute + roles):
  - Hospital Admin: /hospital-admin/*
  - Doctor: /doctor/*
  - Super Admin: /admin/*

File: frontend/src/App.jsx

### 2.2 API Layer (Axios)
- All API calls go through a shared Axios instance
- Endpoints are grouped by feature

File: frontend/src/services/api.js

Main groups:
- authAPI: /auth/*
- hospitalAPI: /hospitals/*
- doctorAPI: /doctors/*
- emergencyAPI: /emergencies/*
- sosAPI: /sos/*
- adminAPI: /admin/*

### 2.3 Auth Context
- On app load: GET /auth/me
- Stores user, isAuthenticated, loading
- Provides login/register/logout utilities

File: frontend/src/context/AuthContext.jsx

### 2.4 Socket Context
- Connects only when authenticated
- Listens for real-time events (emergency updates, bed updates, SOS alerts)

File: frontend/src/context/SocketContext.jsx

## 3) Backend Flow

### 3.1 Main Server
- Express app mounts API routes under /api
- Attaches Socket.IO to server

File: backend/server.js

### 3.2 Route Index
- Central router that mounts feature routes

File: backend/routes/index.js

Mounted routes:
- /api/auth
- /api/hospitals
- /api/doctors
- /api/emergencies
- /api/sos
- /api/admin

### 3.3 Auth Middleware
- protect: requires JWT (cookie or bearer token)
- optionalAuth: attaches user if token exists, continues if not
- authorize: role-based access control

File: backend/middleware/auth.js

## 4) Feature Flows (Request -> Route -> Controller -> Model)

### 4.1 Public Browsing (Hospitals, Doctors)

Frontend:
- Pages: Hospitals, Doctors
- Calls: hospitalAPI.getAll, doctorAPI.getAll

Backend:
- Routes: GET /api/hospitals, GET /api/doctors
- Controllers: hospitalController.getHospitals, doctorController.getDoctors
- Models: Hospital, Doctor

### 4.2 Emergency Request (Public)

Frontend:
- Page: Emergency
- Call: emergencyAPI.create
- Payload: type, patientInfo, pickupLocation, notes, hospitalId

Backend:
- Route: POST /api/emergencies
- Middleware: optionalAuth, validator, rate limiter
- Controller: emergencyController.createEmergency
- Logic:
  - If logged in, uses req.user
  - If guest, creates a guest user (by phone) for tracking
  - Finds hospital if needed
  - Creates Emergency document
  - Emits Socket.IO events

### 4.3 Emergency Tracking (Public)

Frontend:
- Page: EmergencyTrack
- Call: emergencyAPI.getById
- Socket: trackEmergency + emergencyUpdate + ambulanceLocation

Backend:
- Route: GET /api/emergencies/:id
- Controller: emergencyController.getEmergency

Socket:
- Server joins room emergency:{id}
- Emits emergencyUpdate and ambulanceLocation events

### 4.4 SOS Alert (Public Trigger, Staff Respond)

Frontend:
- Page: SOS
- Call: sosAPI.trigger (public)
- If logged in, it can also call getActive

Backend:
- Route: POST /api/sos (optionalAuth)
- Controller: sosController.triggerSOS
- Creates SOSAlert and notifies hospitals

Staff:
- Hospital Admin / Super Admin endpoints:
  - /api/sos/all/active
  - /api/sos/:id/acknowledge
  - /api/sos/:id/responders
  - /api/sos/:id/resolve

### 4.5 Hospital Admin Dashboard

Frontend:
- Page: HospitalDashboard
- Calls:
  - hospitalAPI.getStats(hospitalId)
  - emergencyAPI.getActiveEmergencies(hospitalId)

Backend:
- /api/hospitals/:id/stats
- /api/emergencies/hospital/:hospitalId/active

### 4.6 Super Admin Dashboard

Frontend:
- Page: AdminDashboard
- Call: adminAPI.getDashboard

Backend:
- /api/admin/dashboard
- Controller: adminController.getDashboardStats

## 5) Data Models (MongoDB)

Key models:
- User: roles, auth, profile, hospital/doctor links
- Hospital: beds, ambulances, admin, location
- Doctor: specialization, availability, hospital link
- Emergency: request lifecycle + tracking
- SOSAlert: status + tracking
- AuditLog: system activity

Files: backend/models/*

## 6) Auth and Role Rules

- Public (no login required):
  - Home, Hospitals, Doctors, Emergency, SOS, Emergency Track
- Staff login required:
  - Dashboard, Profile
  - Hospital Admin routes
  - Doctor routes
  - Super Admin routes

Roles:
- doctor
- hospital_admin
- super_admin

## 7) Real-time Event Flow

Server emits:
- bedUpdate
- emergencyUpdate
- ambulanceLocation
- sosAlert

Client listens:
- SocketContext (for notifications)
- EmergencyTrack (for emergency updates)

## 8) Environment & Setup (Quick)

Backend:
- .env with MONGODB_URI, JWT_SECRET, JWT_EXPIRE, JWT_COOKIE_EXPIRE
- Start: npm run dev (in backend)

Frontend:
- VITE_API_URL and VITE_SOCKET_URL (optional)
- Start: npm run dev (in frontend)

## 9) Notes About Current Implementation

- Public users can request emergency/SOS without login.
- Staff-only registration is enabled (no public user signup).
- Super admin and hospital admin accounts can be created by running the seeder.

Seeder:
- backend/utils/seeder.js
- Run: node backend/utils/seeder.js

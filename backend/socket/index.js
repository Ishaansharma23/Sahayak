const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.IO Event Handler
 * Manages real-time connections and events
 */
const initSocketIO = (io) => {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id).select('-password');
          
          if (user && user.isActive) {
            socket.user = user;
          }
        } catch (error) {
          console.log('Socket auth failed:', error.message);
        }
      }
      
      next();
    } catch (error) {
      next(new Error('Socket authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user-specific room if authenticated
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      console.log(`User ${socket.user.email} joined their room`);

      // Join role-specific rooms
      if (socket.user.role === 'super_admin') {
        socket.join('admin');
        console.log(`Admin ${socket.user.email} joined admin room`);
      }

      if (socket.user.role === 'hospital_admin' && socket.user.hospital) {
        socket.join(`hospital:${socket.user.hospital}`);
        console.log(`Hospital admin joined hospital room: ${socket.user.hospital}`);
      }
    }

    // ==================== BED UPDATES ====================
    
    /**
     * Hospital bed availability update
     */
    socket.on('updateBeds', (data) => {
      // Broadcast to all connected clients
      io.emit('bedUpdate', {
        hospitalId: data.hospitalId,
        hospitalName: data.hospitalName,
        bedType: data.bedType,
        available: data.available,
        timestamp: new Date(),
      });
    });

    // ==================== EMERGENCY EVENTS ====================
    
    /**
     * Join emergency tracking room
     */
    socket.on('trackEmergency', (emergencyId) => {
      socket.join(`emergency:${emergencyId}`);
      console.log(`Socket ${socket.id} tracking emergency: ${emergencyId}`);
    });

    /**
     * Leave emergency tracking room
     */
    socket.on('stopTrackingEmergency', (emergencyId) => {
      socket.leave(`emergency:${emergencyId}`);
    });

    /**
     * Ambulance location update (from hospital)
     */
    socket.on('ambulanceLocation', (data) => {
      io.to(`emergency:${data.emergencyId}`).emit('ambulanceLocation', {
        emergencyId: data.emergencyId,
        location: {
          coordinates: data.coordinates,
          heading: data.heading,
          speed: data.speed,
          updatedAt: new Date(),
        },
      });

      // Also send to the user who requested
      if (data.userId) {
        io.to(`user:${data.userId}`).emit('ambulanceLocation', {
          emergencyId: data.emergencyId,
          location: {
            coordinates: data.coordinates,
            heading: data.heading,
            speed: data.speed,
            updatedAt: new Date(),
          },
        });
      }
    });

    /**
     * Emergency status update
     */
    socket.on('emergencyStatusUpdate', (data) => {
      io.to(`emergency:${data.emergencyId}`).emit('emergencyUpdate', {
        emergencyId: data.emergencyId,
        status: data.status,
        message: data.message,
        timestamp: new Date(),
      });

      if (data.userId) {
        io.to(`user:${data.userId}`).emit('emergencyUpdate', {
          emergencyId: data.emergencyId,
          status: data.status,
          message: data.message,
          timestamp: new Date(),
        });
      }
    });

    // ==================== SOS EVENTS ====================
    
    /**
     * Join SOS tracking room
     */
    socket.on('trackSOS', (sosId) => {
      socket.join(`sos:${sosId}`);
      console.log(`Socket ${socket.id} tracking SOS: ${sosId}`);
    });

    /**
     * Leave SOS tracking room
     */
    socket.on('stopTrackingSOS', (sosId) => {
      socket.leave(`sos:${sosId}`);
    });

    /**
     * SOS location update (continuous tracking)
     */
    socket.on('sosLocationUpdate', (data) => {
      io.to(`sos:${data.sosId}`).emit('sosLocationUpdate', {
        alertId: data.alertId,
        location: {
          coordinates: data.coordinates,
          accuracy: data.accuracy,
          speed: data.speed,
          heading: data.heading,
          timestamp: new Date(),
        },
        batteryLevel: data.batteryLevel,
      });

      // Broadcast to admin
      io.to('admin').emit('sosLocationUpdate', {
        alertId: data.alertId,
        sosId: data.sosId,
        location: {
          coordinates: data.coordinates,
          timestamp: new Date(),
        },
      });
    });

    /**
     * SOS status update
     */
    socket.on('sosStatusUpdate', (data) => {
      io.to(`sos:${data.sosId}`).emit('sosStatusUpdate', {
        alertId: data.alertId,
        status: data.status,
        responder: data.responder,
        message: data.message,
        timestamp: new Date(),
      });

      if (data.userId) {
        io.to(`user:${data.userId}`).emit('sosStatusUpdate', {
          alertId: data.alertId,
          status: data.status,
          message: data.message,
          timestamp: new Date(),
        });
      }
    });

    // ==================== DOCTOR AVAILABILITY ====================
    
    /**
     * Doctor availability change
     */
    socket.on('doctorAvailabilityUpdate', (data) => {
      io.emit('doctorAvailability', {
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        status: data.status,
        timestamp: new Date(),
      });
    });

    // ==================== NOTIFICATIONS ====================
    
    /**
     * Send notification to specific user
     */
    socket.on('sendNotification', (data) => {
      io.to(`user:${data.userId}`).emit('notification', {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.payload,
        timestamp: new Date(),
      });
    });

    /**
     * Broadcast to all hospital admins
     */
    socket.on('broadcastToHospitals', (data) => {
      io.emit('hospitalBroadcast', {
        type: data.type,
        message: data.message,
        data: data.payload,
        timestamp: new Date(),
      });
    });

    // ==================== CHAT (Optional) ====================
    
    /**
     * Join chat room
     */
    socket.on('joinChat', (roomId) => {
      socket.join(`chat:${roomId}`);
    });

    /**
     * Send chat message
     */
    socket.on('chatMessage', (data) => {
      io.to(`chat:${data.roomId}`).emit('chatMessage', {
        roomId: data.roomId,
        senderId: socket.user?.id,
        senderName: socket.user?.name,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // ==================== DISCONNECT ====================
    
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

module.exports = initSocketIO;

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        
        // Authenticate socket
        newSocket.emit('authenticate', { userId: user._id, role: user.role });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Handle notifications
      newSocket.on('notification', (data) => {
        setNotifications(prev => [data, ...prev].slice(0, 50));
        
        // Show toast based on notification type
        switch (data.type) {
          case 'sos_alert':
            toast.error(data.message, { 
              duration: 10000,
              icon: '🚨',
            });
            break;
          case 'emergency_update':
            toast(data.message, {
              icon: '🚑',
              duration: 5000,
            });
            break;
          case 'hospital_update':
            toast.success(data.message, {
              icon: '🏥',
            });
            break;
          default:
            toast(data.message);
        }
      });

      // Handle SOS alerts for responders
      newSocket.on('sosAlert', (data) => {
        toast.error('SOS Alert received', {
          duration: 15000,
          icon: '🆘',
        });
        setNotifications(prev => [{
          type: 'sos_alert',
          message: 'New SOS alert',
          data: data,
          timestamp: new Date(),
        }, ...prev].slice(0, 50));
      });

      // Handle emergency updates
      newSocket.on('emergencyUpdate', (data) => {
        toast(data.message || 'Emergency updated', {
          icon: '🚑',
          duration: 5000,
        });
      });

      // Handle bed availability updates
      newSocket.on('bedUpdate', (data) => {
        setNotifications(prev => [{
          type: 'bed_update',
          message: `Bed availability updated at ${data.hospitalName}`,
          data: data,
          timestamp: new Date(),
        }, ...prev].slice(0, 50));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  // Join a room
  const joinRoom = useCallback((room) => {
    if (socket && isConnected) {
      socket.emit('join_room', room);
    }
  }, [socket, isConnected]);

  // Leave a room
  const leaveRoom = useCallback((room) => {
    if (socket && isConnected) {
      socket.emit('leave_room', room);
    }
  }, [socket, isConnected]);

  // Emit location update
  const updateLocation = useCallback((location) => {
    if (socket && isConnected) {
      socket.emit('location:update', location);
    }
  }, [socket, isConnected]);

  // Emit SOS alert
  const emitSOS = useCallback((sosData) => {
    if (socket && isConnected) {
      socket.emit('sos:trigger', sosData);
    }
  }, [socket, isConnected]);

  // Emit emergency update
  const emitEmergencyUpdate = useCallback((emergencyData) => {
    if (socket && isConnected) {
      socket.emit('emergency:update', emergencyData);
    }
  }, [socket, isConnected]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((index) => {
    setNotifications(prev => 
      prev.map((n, i) => i === index ? { ...n, read: true } : n)
    );
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    joinRoom,
    leaveRoom,
    updateLocation,
    emitSOS,
    emitEmergencyUpdate,
    clearNotifications,
    markAsRead,
    unreadCount: notifications.filter(n => !n.read).length,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

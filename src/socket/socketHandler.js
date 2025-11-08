const jwt = require('jsonwebtoken');
const { SOCKET_EVENTS } = require('../config/constants');

// Store socket.io instance globally for access from other modules
let ioInstance = null;

const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

const socketHandler = (io) => {
  ioInstance = io; // Store for use in other modules
  io.use(authenticateSocket);

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`✅ User connected: ${socket.user.id} (${socket.user.role})`);

    // Join user's personal notification room
    socket.join(`user_${socket.user.id}`);

    // Join ambulance room
    socket.on(SOCKET_EVENTS.JOIN_AMBULANCE, (data) => {
      const { ambulanceId } = data;
      socket.join(`ambulance_${ambulanceId}`);
      console.log(`User ${socket.user.id} joined ambulance room: ambulance_${ambulanceId}`);
      
      socket.emit('joined_ambulance', { 
        success: true, 
        ambulanceId,
        message: `Joined ambulance ${ambulanceId} successfully` 
      });
    });

    // Leave ambulance room
    socket.on(SOCKET_EVENTS.LEAVE_AMBULANCE, (data) => {
      const { ambulanceId } = data;
      socket.leave(`ambulance_${ambulanceId}`);
      console.log(`User ${socket.user.id} left ambulance room: ambulance_${ambulanceId}`);
    });

    // Join session room (for active patient sessions)
    // NOTE: Moved this to after MESSAGE handler to avoid duplication
    // See "Broadcast when user joins session" above for the actual implementation

    // Leave session room
    socket.on('leave_session', (data) => {
      const { sessionId } = data;
      socket.leave(`session_${sessionId}`);
      
      // Notify others in the session
      socket.to(`session_${sessionId}`).emit('user_left', {
        sessionId,
        userId: socket.user.id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`
      });
      
      console.log(`👋 User ${socket.user.id} left session room: session_${sessionId}`);
    });

    // Handle vital signs update (from paramedic device)
    socket.on(SOCKET_EVENTS.VITAL_UPDATE, (data) => {
      const { sessionId, vitals } = data;
      
      // Broadcast to all users in the session room (doctors, paramedics)
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.VITAL_UPDATE, {
        sessionId,
        vitals,
        timestamp: new Date().toISOString(),
        updatedBy: socket.user.id
      });

      console.log(`Vital signs updated for session ${sessionId}`);
    });

    // Handle location update (from ambulance GPS)
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, (data) => {
      const { ambulanceId, latitude, longitude } = data;
      
      // Broadcast to all users tracking this ambulance
      io.to(`ambulance_${ambulanceId}`).emit(SOCKET_EVENTS.LOCATION_UPDATE, {
        ambulanceId,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });

      console.log(`Location updated for ambulance ${ambulanceId}`);
    });

    // Handle text messages between doctor and paramedic (GROUP CHAT)
    socket.on(SOCKET_EVENTS.MESSAGE, (data) => {
      const { sessionId, message, messageType, metadata } = data;
      
      // Broadcast to all users in session room (group chat)
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.MESSAGE, {
        sessionId,
        senderId: socket.user.id,
        senderFirstName: socket.user.firstName,
        senderLastName: socket.user.lastName,
        senderRole: socket.user.role,
        message,
        messageType: messageType || 'text',
        metadata,
        timestamp: new Date().toISOString()
      });

      console.log(`💬 Message sent in session ${sessionId} by ${socket.user.firstName} ${socket.user.lastName}`);
    });

    // Handle typing indicator (group chat)
    socket.on('typing_start', (data) => {
      const { sessionId } = data;
      socket.to(`session_${sessionId}`).emit('user_typing', {
        sessionId,
        userId: socket.user.id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        userRole: socket.user.role,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { sessionId } = data;
      socket.to(`session_${sessionId}`).emit('user_typing', {
        sessionId,
        userId: socket.user.id,
        isTyping: false
      });
    });

    // Handle message read receipts (group chat)
    socket.on('message_read', (data) => {
      const { sessionId, messageId } = data;
      io.to(`session_${sessionId}`).emit('message_read', {
        sessionId,
        messageId,
        userId: socket.user.id,
        readAt: new Date().toISOString()
      });
    });

    // Get online users in a session
    socket.on('get_online_users', async (data) => {
      const { sessionId } = data;
      const room = io.sockets.adapter.rooms.get(`session_${sessionId}`);
      const onlineUsers = [];
      
      if (room) {
        for (const socketId of room) {
          const userSocket = io.sockets.sockets.get(socketId);
          if (userSocket && userSocket.user) {
            onlineUsers.push({
              id: userSocket.user.id,
              firstName: userSocket.user.firstName,
              lastName: userSocket.user.lastName,
              role: userSocket.user.role,
              email: userSocket.user.email
            });
          }
        }
      }
      
      socket.emit('online_users', { sessionId, users: onlineUsers });
    });

    // Broadcast when user joins session (for online status)
    socket.on('join_session', (data) => {
      const { sessionId } = data;
      socket.join(`session_${sessionId}`);
      
      // Notify others in the session
      socket.to(`session_${sessionId}`).emit('user_joined', {
        sessionId,
        userId: socket.user.id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        userRole: socket.user.role
      });
      
      console.log(`👋 User ${socket.user.firstName} ${socket.user.lastName} joined session room: session_${sessionId}`);
      
      socket.emit('joined_session', { 
        success: true, 
        sessionId,
        message: `Joined session ${sessionId} successfully` 
      });
    });

    // Handle call request (audio call)
    socket.on(SOCKET_EVENTS.CALL_REQUEST, (data) => {
      const { sessionId, receiverId } = data;
      
      // Send to specific receiver
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.CALL_REQUEST, {
        sessionId,
        callerId: socket.user.id,
        callerRole: socket.user.role,
        receiverId,
        timestamp: new Date().toISOString()
      });

      console.log(`Call request from ${socket.user.id} to ${receiverId} in session ${sessionId}`);
    });

    // Handle call answer
    socket.on(SOCKET_EVENTS.CALL_ANSWER, (data) => {
      const { sessionId, callerId, accepted } = data;
      
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.CALL_ANSWER, {
        sessionId,
        responderId: socket.user.id,
        callerId,
        accepted,
        timestamp: new Date().toISOString()
      });

      console.log(`Call ${accepted ? 'accepted' : 'rejected'} in session ${sessionId}`);
    });

    // Handle call end
    socket.on(SOCKET_EVENTS.CALL_END, (data) => {
      const { sessionId } = data;
      
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.CALL_END, {
        sessionId,
        endedBy: socket.user.id,
        timestamp: new Date().toISOString()
      });

      console.log(`Call ended in session ${sessionId}`);
    });

    // Handle video call request
    socket.on(SOCKET_EVENTS.VIDEO_REQUEST, (data) => {
      const { sessionId, receiverId, offer } = data;
      
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.VIDEO_REQUEST, {
        sessionId,
        callerId: socket.user.id,
        callerRole: socket.user.role,
        receiverId,
        offer,
        timestamp: new Date().toISOString()
      });

      console.log(`Video call request from ${socket.user.id} to ${receiverId} in session ${sessionId}`);
    });

    // Handle video call answer
    socket.on(SOCKET_EVENTS.VIDEO_ANSWER, (data) => {
      const { sessionId, callerId, accepted, answer } = data;
      
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.VIDEO_ANSWER, {
        sessionId,
        responderId: socket.user.id,
        callerId,
        accepted,
        answer,
        timestamp: new Date().toISOString()
      });

      console.log(`Video call ${accepted ? 'accepted' : 'rejected'} in session ${sessionId}`);
    });

    // Handle video call end
    socket.on(SOCKET_EVENTS.VIDEO_END, (data) => {
      const { sessionId } = data;
      
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.VIDEO_END, {
        sessionId,
        endedBy: socket.user.id,
        timestamp: new Date().toISOString()
      });

      console.log(`Video call ended in session ${sessionId}`);
    });

    // Handle WebRTC ICE candidates (for peer-to-peer connection)
    socket.on('ice_candidate', (data) => {
      const { sessionId, candidate, targetUserId } = data;
      
      io.to(`session_${sessionId}`).emit('ice_candidate', {
        sessionId,
        fromUserId: socket.user.id,
        candidate,
        targetUserId
      });
    });

    // Handle emergency alerts
    socket.on('emergency_alert', (data) => {
      const { ambulanceId, sessionId, alertType, message } = data;
      
      // Broadcast to all relevant parties
      io.to(`ambulance_${ambulanceId}`).emit('emergency_alert', {
        ambulanceId,
        sessionId,
        alertType,
        message,
        userId: socket.user.id,
        userRole: socket.user.role,
        timestamp: new Date().toISOString()
      });

      console.log(`🚨 Emergency alert in ambulance ${ambulanceId}: ${alertType}`);
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log(`❌ User disconnected: ${socket.user.id}, Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Error handler
  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  console.log('✅ Socket.IO handler initialized');
};

// Helper function to emit notifications to specific users
const emitNotification = (userId, notification) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('notification', notification);
  }
};

// Helper function to emit notifications to multiple users
const emitBulkNotifications = (notifications) => {
  if (ioInstance && Array.isArray(notifications)) {
    notifications.forEach(notif => {
      if (notif.userId) {
        ioInstance.to(`user_${notif.userId}`).emit('notification', notif);
      }
    });
  }
};

module.exports = socketHandler;
module.exports.emitNotification = emitNotification;
module.exports.emitBulkNotifications = emitBulkNotifications;

const jwt = require('jsonwebtoken');
const { SOCKET_EVENTS } = require('../config/constants');

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
  io.use(authenticateSocket);

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`✅ User connected: ${socket.user.id} (${socket.user.role})`);

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
    socket.on('join_session', (data) => {
      const { sessionId } = data;
      socket.join(`session_${sessionId}`);
      console.log(`User ${socket.user.id} joined session room: session_${sessionId}`);
      
      socket.emit('joined_session', { 
        success: true, 
        sessionId,
        message: `Joined session ${sessionId} successfully` 
      });
    });

    // Leave session room
    socket.on('leave_session', (data) => {
      const { sessionId } = data;
      socket.leave(`session_${sessionId}`);
      console.log(`User ${socket.user.id} left session room: session_${sessionId}`);
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

    // Handle text messages between doctor and paramedic
    socket.on(SOCKET_EVENTS.MESSAGE, (data) => {
      const { sessionId, message, receiverId } = data;
      
      // Broadcast to session room
      io.to(`session_${sessionId}`).emit(SOCKET_EVENTS.MESSAGE, {
        sessionId,
        senderId: socket.user.id,
        senderRole: socket.user.role,
        message,
        timestamp: new Date().toISOString()
      });

      console.log(`Message sent in session ${sessionId}`);
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

module.exports = socketHandler;

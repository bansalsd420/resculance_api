import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  getSocket() {
    return this.socket;
  }

  // Ambulance room management
  joinAmbulanceRoom(ambulanceId) {
    this.socket?.emit('join_ambulance', { ambulanceId });
  }

  leaveAmbulanceRoom(ambulanceId) {
    this.socket?.emit('leave_ambulance', { ambulanceId });
  }

  // Session room management
  joinSessionRoom(sessionId) {
    this.socket?.emit('join_session', { sessionId });
  }

  leaveSessionRoom(sessionId) {
    this.socket?.emit('leave_session', { sessionId });
  }

  // Location updates
  updateLocation(ambulanceId, latitude, longitude) {
    this.socket?.emit('location_update', { ambulanceId, latitude, longitude });
  }

  onLocationUpdate(callback) {
    this.socket?.on('location_update', callback);
    this.listeners.set('location_update', callback);
  }

  // Vital signs
  updateVitals(sessionId, vitals) {
    this.socket?.emit('vital_update', { sessionId, vitals });
  }

  onVitalUpdate(callback) {
    this.socket?.on('vital_update', callback);
    this.listeners.set('vital_update', callback);
  }

  // Messaging
  sendMessage(sessionId, message, receiverId) {
    this.socket?.emit('message', { sessionId, message, receiverId });
  }

  onMessage(callback) {
    this.socket?.on('message', callback);
    this.listeners.set('message', callback);
  }

  // Audio/Video calls
  requestCall(sessionId, receiverId) {
    this.socket?.emit('call_request', { sessionId, receiverId });
  }

  answerCall(sessionId, callerId, accepted) {
    this.socket?.emit('call_answer', { sessionId, callerId, accepted });
  }

  endCall(sessionId) {
    this.socket?.emit('call_end', { sessionId });
  }

  onCallRequest(callback) {
    this.socket?.on('call_request', callback);
    this.listeners.set('call_request', callback);
  }

  onCallAnswer(callback) {
    this.socket?.on('call_answer', callback);
    this.listeners.set('call_answer', callback);
  }

  onCallEnd(callback) {
    this.socket?.on('call_end', callback);
    this.listeners.set('call_end', callback);
  }

  // Video calls
  requestVideo(sessionId, receiverId, offer) {
    this.socket?.emit('video_request', { sessionId, receiverId, offer });
  }

  answerVideo(sessionId, callerId, accepted, answer) {
    this.socket?.emit('video_answer', { sessionId, callerId, accepted, answer });
  }

  endVideo(sessionId) {
    this.socket?.emit('video_end', { sessionId });
  }

  onVideoRequest(callback) {
    this.socket?.on('video_request', callback);
    this.listeners.set('video_request', callback);
  }

  onVideoAnswer(callback) {
    this.socket?.on('video_answer', callback);
    this.listeners.set('video_answer', callback);
  }

  onVideoEnd(callback) {
    this.socket?.on('video_end', callback);
    this.listeners.set('video_end', callback);
  }

  // WebRTC ICE candidates
  sendIceCandidate(sessionId, candidate, targetUserId) {
    this.socket?.emit('ice_candidate', { sessionId, candidate, targetUserId });
  }

  onIceCandidate(callback) {
    this.socket?.on('ice_candidate', callback);
    this.listeners.set('ice_candidate', callback);
  }

  // Emergency alerts
  sendEmergencyAlert(ambulanceId, sessionId, alertType, message) {
    this.socket?.emit('emergency_alert', { ambulanceId, sessionId, alertType, message });
  }

  onEmergencyAlert(callback) {
    this.socket?.on('emergency_alert', callback);
    this.listeners.set('emergency_alert', callback);
  }

  // Patient events
  onPatientOnboarded(callback) {
    this.socket?.on('patient_onboarded', callback);
    this.listeners.set('patient_onboarded', callback);
  }

  onPatientOffboarded(callback) {
    this.socket?.on('patient_offboarded', callback);
    this.listeners.set('patient_offboarded', callback);
  }

  // Remove event listener
  off(eventName) {
    if (this.socket && this.listeners.has(eventName)) {
      this.socket.off(eventName, this.listeners.get(eventName));
      this.listeners.delete(eventName);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((callback, eventName) => {
        this.socket.off(eventName, callback);
      });
      this.listeners.clear();
    }
  }
}

export const socketService = new SocketService();

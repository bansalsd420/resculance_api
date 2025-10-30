import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
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
    }
  }

  getSocket() {
    return this.socket;
  }

  // Ambulance events
  trackAmbulance(ambulanceId) {
    this.socket?.emit('ambulance:track', { ambulanceId });
  }

  updateAmbulanceLocation(ambulanceId, latitude, longitude) {
    this.socket?.emit('ambulance:location:update', { ambulanceId, latitude, longitude });
  }

  // Patient events
  joinPatientRoom(patientId) {
    this.socket?.emit('patient:join', { patientId });
  }

  leavePatientRoom(patientId) {
    this.socket?.emit('patient:leave', { patientId });
  }

  // Collaboration events
  joinCollaborationRoom(requestId) {
    this.socket?.emit('collaboration:join', { requestId });
  }
}

export const socketService = new SocketService();

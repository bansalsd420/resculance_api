/**
 * Camera Service
 * Handles camera feed authentication and streaming via backend proxy
 */

import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class CameraService {
  constructor() {
    this.sessions = new Map(); // Store stream URLs per device
  }

  /**
   * Get camera stream URL through backend proxy
   * @param {Object} device - Device object
   * @param {string} device.id - Database device ID
   * @param {string} device.deviceId - Device hardware ID
   * @returns {Promise<string>} - Authenticated camera stream URL
   */
  async getCameraStreamUrl(device) {
    const { id, deviceId } = device;

    if (!id) {
      throw new Error('Device database ID is required');
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/ambulances/devices/${id}/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || response.statusText;
        const error = new Error(errorMsg);
        error.response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      
      if (!result.success || !result.data?.streamUrl) {
        const error = new Error(result.message || 'Invalid response from server');
        error.response = { data: result, status: response.status };
        throw error;
      }

      return result.data.streamUrl;
    } catch (error) {
      console.error('Failed to get camera stream URL:', error);
      throw error;
    }
  }

  /**
   * Clear session for a device
   * @param {string} deviceId
   */
  clearSession(deviceId) {
    this.sessions.delete(deviceId);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions() {
    this.sessions.clear();
  }
}

// Export singleton instance
export default new CameraService();

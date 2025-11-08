/**
 * Camera Service
 * Handles camera feed authentication and streaming via 808GPS API
 */

const CAMERA_API_BASE = 'http://205.147.109.152';

class CameraService {
  constructor() {
    this.sessions = new Map(); // Store JSESSIONID per device/account
  }

  /**
   * Login to 808GPS camera API
   * @param {string} username - Camera system username
   * @param {string} password - Camera system password
   * @returns {Promise<Object>} - Session data with JSESSIONID
   */
  async login(username, password) {
    try {
      const response = await fetch(
        `${CAMERA_API_BASE}/StandardApiAction_login.action?account=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Camera API login failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.result !== 0) {
        throw new Error(`Camera API login failed with result code: ${data.result}`);
      }

      // Store session for this account
      this.sessions.set(username, {
        jsessionId: data.JSESSIONID || data.jsession,
        accountName: data.account_name,
        timestamp: Date.now(),
      });

      return {
        success: true,
        jsessionId: data.JSESSIONID || data.jsession,
        accountName: data.account_name,
      };
    } catch (error) {
      console.error('Camera login error:', error);
      throw error;
    }
  }

  /**
   * Get or create camera session
   * @param {string} username - Camera system username
   * @param {string} password - Camera system password
   * @returns {Promise<string>} - JSESSIONID
   */
  async getSession(username, password) {
    // Check if we have a valid session (less than 30 minutes old)
    const cached = this.sessions.get(username);
    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return cached.jsessionId;
    }

    // Login to get new session
    const loginResult = await this.login(username, password);
    return loginResult.jsessionId;
  }

  /**
   * Build camera stream URL
   * @param {string} deviceId - Device ID (from ambulance device data)
   * @param {string} jsessionId - Session ID from login
   * @param {string} lang - Language (default: 'en')
   * @returns {string} - Camera stream URL
   */
  buildStreamUrl(deviceId, jsessionId, lang = 'en') {
    return `${CAMERA_API_BASE}/808gps/open/player/video.html?lang=${lang}&devIdno=${encodeURIComponent(deviceId)}&jsession=${encodeURIComponent(jsessionId)}`;
  }

  /**
   * Get camera stream URL with authentication
   * @param {Object} device - Device object with credentials
   * @param {string} device.deviceId - Device ID
   * @param {string} device.username - Camera system username
   * @param {string} device.password - Camera system password
   * @returns {Promise<string>} - Authenticated camera stream URL
   */
  async getCameraStreamUrl(device) {
    const { deviceId, username, password } = device;

    if (!deviceId || !username || !password) {
      throw new Error('Device ID, username, and password are required');
    }

    try {
      const jsessionId = await this.getSession(username, password);
      return this.buildStreamUrl(deviceId, jsessionId);
    } catch (error) {
      console.error('Failed to get camera stream URL:', error);
      throw error;
    }
  }

  /**
   * Clear session for a username
   * @param {string} username
   */
  clearSession(username) {
    this.sessions.delete(username);
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

const AmbulanceDeviceModel = require('../models/AmbulanceDevice');
const AmbulanceModel = require('../models/Ambulance');
const { AppError } = require('../middleware/auth');
const axios = require('axios');
const https = require('https');

// Create HTTPS agent that bypasses SSL verification for vehicleview.live
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

class AmbulanceDeviceController {
  static async create(req, res, next) {
    try {
      const { ambulanceId } = req.params;
      const { deviceName, deviceType, deviceId, deviceUsername, devicePassword, deviceApi, manufacturer, model } = req.body;

      // Validate required fields
      if (!deviceName || !deviceType || !deviceId) {
        return next(new AppError('Device name, type, and ID are required', 400));
      }

      // Check if ambulance exists
      const ambulance = await AmbulanceModel.findById(ambulanceId);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      // Check if device ID already exists for this ambulance
      const existingDevice = await AmbulanceDeviceModel.findByDeviceIdForAmbulance(deviceId, ambulanceId);
      if (existingDevice) {
        // If device already exists, update it instead of creating a new one
        await AmbulanceDeviceModel.update(existingDevice.id, {
          deviceName,
          deviceType,
          deviceId,
          deviceUsername,
          devicePassword,
          deviceApi,
          manufacturer,
          model
        });

        const updatedDevice = await AmbulanceDeviceModel.findById(existingDevice.id);

        return res.status(200).json({
          success: true,
          message: 'Device already exists, updated successfully',
          data: updatedDevice
        });
      }

      const deviceDbId = await AmbulanceDeviceModel.create({
        ambulanceId,
        deviceName,
        deviceType,
        deviceId,
        deviceUsername,
        devicePassword,
        deviceApi,
        manufacturer,
        model
      });

      const newDevice = await AmbulanceDeviceModel.findById(deviceDbId);

      return res.status(201).json({
        success: true,
        message: 'Device added successfully',
        data: newDevice
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByAmbulance(req, res, next) {
    try {
      const { ambulanceId } = req.params;

      // Check if ambulance exists
      const ambulance = await AmbulanceModel.findById(ambulanceId);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      const devices = await AmbulanceDeviceModel.findByAmbulance(ambulanceId);

      res.json({
        success: true,
        data: devices
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const device = await AmbulanceDeviceModel.findById(id);
      if (!device) {
        return next(new AppError('Device not found', 404));
      }

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const device = await AmbulanceDeviceModel.findById(id);
      if (!device) {
        return next(new AppError('Device not found', 404));
      }

      // If updating deviceId, check it doesn't exist for this ambulance (excluding current device)
      // if (updateData.deviceId && updateData.deviceId !== device.device_id) {
      //   const existingDevice = await AmbulanceDeviceModel.findByDeviceIdForAmbulance(updateData.deviceId, device.ambulance_id);
      //   if (existingDevice && existingDevice.id !== device.id) {
      //     return next(new AppError('Device ID already exists for this ambulance', 400));
      //   }
      // }

      await AmbulanceDeviceModel.update(id, updateData);

      const updatedDevice = await AmbulanceDeviceModel.findById(id);

      res.json({
        success: true,
        message: 'Device updated successfully',
        data: updatedDevice
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const device = await AmbulanceDeviceModel.findById(id);
      if (!device) {
        return next(new AppError('Device not found', 404));
      }

      await AmbulanceDeviceModel.delete(id);

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDeviceLocation(req, res, next) {
    try {
      const { id } = req.params;

      const device = await AmbulanceDeviceModel.findById(id);
      if (!device) {
        return next(new AppError('Device not found', 404));
      }

      // Only for GPS/Location devices
      if (!['GPS_TRACKER', 'LIVE_LOCATION'].includes(device.device_type)) {
        return next(new AppError('Device is not a GPS tracker', 400));
      }

      if (!device.device_id) {
        return next(new AppError('Device ID not configured', 400));
      }

      // Return device credentials for frontend to make direct API call
      res.json({
        success: true,
        data: {
          deviceId: device.device_id,
          jsession: device.device_password || device.device_username || '',
          apiUrl: 'https://vehicleview.live/808gps/StandardApiAction_getDeviceStatus.action'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAmbulanceDevicesLocation(req, res, next) {
    try {
      const { ambulanceId } = req.params;

      const devices = await AmbulanceDeviceModel.findByAmbulance(ambulanceId);
      const gpsDevices = devices.filter(d => 
        ['GPS_TRACKER', 'LIVE_LOCATION'].includes(d.device_type) && 
        d.status === 'active' &&
        d.device_id
      );

      if (gpsDevices.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Fetch location for all GPS devices
      const apiUrl = 'https://vehicleview.live/808gps/StandardApiAction_getDeviceStatus.action';
      const locationPromises = gpsDevices.map(async (device) => {
        try {
          const response = await axios.get(apiUrl, {
            params: {
              jsession: device.device_password || device.device_username || '',
              devIdno: device.device_id,
              toMap: '1',
              language: 'zh'
            },
            timeout: 10000,
            httpsAgent
          });

          return {
            deviceId: device.id,
            deviceName: device.device_name,
            deviceIdno: device.device_id,
            location: response.data
          };
        } catch (error) {
          console.error(`Failed to fetch location for device ${device.device_id}:`, error);
          return {
            deviceId: device.id,
            deviceName: device.device_name,
            deviceIdno: device.device_id,
            error: error.message
          };
        }
      });

      const locations = await Promise.all(locationPromises);

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDeviceStream(req, res, next) {
    try {
      const { id } = req.params;

      const device = await AmbulanceDeviceModel.findById(id);
      if (!device) {
        return next(new AppError('Device not found', 404));
      }

      // Only for Camera devices
      if (device.device_type !== 'CAMERA') {
        return next(new AppError('Device is not a camera', 400));
      }

      if (!device.device_id || !device.device_username || !device.device_password) {
        return next(new AppError('Device credentials not configured', 400));
      }

      // Return device credentials for frontend to authenticate and get stream
      const apiBase = device.device_api || 'https://vehicleview.live/808gps';
      
      res.json({
        success: true,
        data: {
          deviceId: device.device_id,
          deviceName: device.device_name,
          username: device.device_username,
          password: device.device_password,
          apiBase: apiBase,
          loginUrl: `${apiBase}/StandardApiAction_login.action`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDeviceData(req, res, next) {
    try {
      const { id } = req.params;

      const device = await AmbulanceDeviceModel.findById(id);
      if (!device) {
        return next(new AppError('Device not found', 404));
      }

      // Handle different device types
      switch (device.device_type) {
        case 'GPS_TRACKER':
        case 'LIVE_LOCATION':
          // Fetch GPS location
          try {
            const apiUrl = 'https://vehicleview.live/808gps/StandardApiAction_getDeviceStatus.action';
            const response = await axios.get(apiUrl, {
              params: {
                jsession: device.device_password || device.device_username || '',
                devIdno: device.device_id,
                toMap: '1',
                language: 'zh'
              },
              timeout: 10000,
              httpsAgent
            });

            return res.json({
              success: true,
              deviceType: device.device_type,
              data: response.data
            });
          } catch (apiError) {
            return next(new AppError('Failed to fetch GPS data: ' + apiError.message, 500));
          }

        case 'CAMERA':
          // Fetch camera stream URL
          try {
            const apiBase = device.device_api || 'https://vehicleview.live/808gps';
            const loginUrl = `${apiBase}/StandardApiAction_login.action`;
            
            const response = await axios.get(loginUrl, {
              params: {
                account: device.device_username,
                password: device.device_password
              },
              timeout: 10000,
              httpsAgent
            });

            // Check for login failure
            if (response.data?.result !== 0) {
              const errorMsg = response.data?.message || 'Authentication failed';
              return next(new AppError(`Camera authentication failed: ${errorMsg}. Please check device username and password.`, 401));
            }

            const jsession = response.data?.jsession || response.data?.JSESSIONID;
            
            if (!jsession) {
              return next(new AppError('Failed to obtain camera session', 500));
            }

            const streamUrl = `${apiBase}/808gps/open/player/video.html?lang=en&devIdno=${encodeURIComponent(device.device_id)}&jsession=${encodeURIComponent(jsession)}`;

            return res.json({
              success: true,
              deviceType: device.device_type,
              data: {
                streamUrl,
                jsession,
                deviceId: device.device_id
              }
            });
          } catch (apiError) {
            return next(new AppError('Failed to fetch camera data: ' + apiError.message, 500));
          }

        case 'ECG':
        case 'VITAL_MONITOR':
          // For ECG and Vital monitors, return device info
          // These might need different API integrations based on device manufacturer
          return res.json({
            success: true,
            deviceType: device.device_type,
            data: {
              deviceId: device.device_id,
              deviceName: device.device_name,
              status: device.status,
              message: 'Real-time data streaming requires device-specific integration'
            }
          });

        default:
          return next(new AppError('Unknown device type', 400));
      }
    } catch (error) {
      next(error);
    }
  }

  static async authenticate(req, res, next) {
    try {
      const { id } = req.params;

      const device = await AmbulanceDeviceModel.findById(id);
      if (!device) {
        return next(new AppError('Device not found', 404));
      }

      // Validate device has authentication credentials
      if (!device.device_username || !device.device_password || !device.device_api) {
        return next(new AppError('Device authentication credentials not configured', 400));
      }

      // Authenticate with 808gps API
      // Format: https://vehicleview.live/808gps/StandardApiAction_login.action?account=testing&password=Testing@123
      const loginUrl = `${device.device_api}/StandardApiAction_login.action`;
      
      try {
        const response = await axios.get(loginUrl, {
          params: {
            account: device.device_username,
            password: device.device_password
          },
          timeout: 10000,
          httpsAgent
        });

        // 808gps API returns jsession in response
        // Expected response format: { jsession: "255ebdd9833e4fd0878ddda7b876c584", ... }
        const jsession = response.data?.jsession;
        
        if (!jsession) {
          return next(new AppError('Failed to obtain session from device API', 500));
        }

        // Store jsession in database
        await AmbulanceDeviceModel.updateSession(id, jsession);

        res.json({
          success: true,
          message: 'Device authenticated successfully',
          data: {
            jsession,
            deviceId: device.device_id,
            videoUrl: `${device.device_api}/808gps/open/player/video.html?lang=en&devIdno=${device.device_id}&jsession=${jsession}`
          }
        });
      } catch (apiError) {
        console.error('Device API authentication error:', apiError);
        return next(new AppError('Failed to authenticate with device API: ' + (apiError.message || 'Unknown error'), 500));
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AmbulanceDeviceController;

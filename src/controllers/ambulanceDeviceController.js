const AmbulanceDeviceModel = require('../models/AmbulanceDevice');
const AmbulanceModel = require('../models/Ambulance');
const { AppError } = require('../middleware/auth');
const axios = require('axios');

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
      // Format: http://205.147.109.152/StandardApiAction_login.action?account=testing&password=Testing@123
      const loginUrl = `${device.device_api}/StandardApiAction_login.action`;
      
      try {
        const response = await axios.get(loginUrl, {
          params: {
            account: device.device_username,
            password: device.device_password
          },
          timeout: 10000
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

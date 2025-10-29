const AmbulanceModel = require('../models/Ambulance');
const OrganizationModel = require('../models/Organization');
const UserModel = require('../models/User');
const { AppError } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

class AmbulanceController {
  static async create(req, res, next) {
    try {
      const { vehicleNumber, vehicleModel, vehicleType } = req.body;

      // Auto-generate ambulance code
      const ambulanceCode = `AMB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Users can only create ambulances for their organization (except superadmin)
      const organizationId = req.user.role === 'superadmin'
        ? req.body.organizationId
        : req.user.organizationId;

      const ambulanceId = await AmbulanceModel.create({
        organizationId,
        ambulanceCode,
        registrationNumber: vehicleNumber, // Map vehicleNumber to registrationNumber
        vehicleModel,
        vehicleType,
        status: 'pending_approval',
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Ambulance created successfully. Awaiting approval.',
        data: { ambulanceId }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      // Users see only their organization's ambulances (except superadmin)
      const organizationId = req.user.role === 'superadmin'
        ? req.query.organizationId
        : req.user.organizationId;

      const filters = { organizationId, status, limit, offset };
      const ambulances = await AmbulanceModel.findAll(filters);
      const total = await AmbulanceModel.count({ organizationId, status });

      res.json({
        success: true,
        data: {
          ambulances,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + ambulances.length) < total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const ambulance = await AmbulanceModel.findById(id);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      res.json({
        success: true,
        data: { ambulance }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { vehicleModel, vehicleType, status } = req.body;

      const ambulance = await AmbulanceModel.findById(id);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      await AmbulanceModel.update(id, {
        vehicle_model: vehicleModel,
        vehicle_type: vehicleType,
        status
      });

      res.json({
        success: true,
        message: 'Ambulance updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const { id } = req.params;

      // Only superadmin can approve ambulances
      if (req.user.role !== 'superadmin') {
        return next(new AppError('Only superadmin can approve ambulances', 403));
      }

      const ambulance = await AmbulanceModel.findById(id);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      await AmbulanceModel.approve(id, req.user.id);

      res.json({
        success: true,
        message: 'Ambulance approved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignUser(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const ambulance = await AmbulanceModel.findById(id);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check if user is a doctor or paramedic (case-insensitive)
      const roleLower = user.role.toLowerCase();
      if (!roleLower.includes('doctor') && !roleLower.includes('paramedic')) {
        return next(new AppError('Only doctors and paramedics can be assigned to ambulances', 400));
      }

      await AmbulanceModel.assignUser(id, userId, req.user.id);

      res.json({
        success: true,
        message: 'User assigned to ambulance successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async unassignUser(req, res, next) {
    try {
      const { id, userId } = req.params;

      await AmbulanceModel.unassignUser(id, userId);

      res.json({
        success: true,
        message: 'User unassigned from ambulance successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignedUsers(req, res, next) {
    try {
      const { id } = req.params;

      const users = await AmbulanceModel.getAssignedUsers(id);

      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateLocation(req, res, next) {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      await AmbulanceModel.updateLocation(id, latitude, longitude);

      // Emit socket event for real-time update
      const io = req.app.get('io');
      io.to(`ambulance_${id}`).emit('location_update', { latitude, longitude });

      res.json({
        success: true,
        message: 'Location updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const ambulance = await AmbulanceModel.findById(id);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      await AmbulanceModel.delete(id);

      res.json({
        success: true,
        message: 'Ambulance deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserAmbulances(req, res, next) {
    try {
      const ambulances = await AmbulanceModel.findMappedToUser(req.user.id);

      res.json({
        success: true,
        data: { ambulances }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AmbulanceController;

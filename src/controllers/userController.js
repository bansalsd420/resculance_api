const UserModel = require('../models/User');
const { AppError } = require('../middleware/auth');

class UserController {
  static async create(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body;

      // Check permissions - only admins can create users
      if (!['superadmin', 'hospital_admin', 'fleet_admin'].includes(req.user.role)) {
        return next(new AppError('You do not have permission to create users', 403));
      }

      // Check if email already exists
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return next(new AppError('Email already registered', 400));
      }

      // Auto-generate username from email
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

      // Users can only create users for their own organization (except superadmin)
      const organizationId = req.user.role === 'superadmin' 
        ? req.body.organizationId 
        : req.user.organizationId;

      const userId = await UserModel.create({
        email,
        username,
        password,
        firstName,
        lastName,
        role,
        phone,
        organizationId,
        status: 'pending_approval',
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully. Awaiting approval.',
        data: { userId }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { role, status, limit = 50, offset = 0 } = req.query;

      // Users can only view users from their organization (except superadmin)
      const organizationId = req.user.role === 'superadmin' 
        ? req.query.organizationId 
        : req.user.organizationId;

      const filters = { organizationId, role, status, limit, offset };
      const users = await UserModel.findAll(filters);
      const total = await UserModel.count({ organizationId, role, status });

      // Remove passwords from response
      users.forEach(user => delete user.password);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + users.length) < total
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

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check access permissions
      if (req.user.role !== 'superadmin' && user.organization_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      delete user.password;

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, status } = req.body;

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check permissions
      if (req.user.role !== 'superadmin' && user.organization_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      await UserModel.update(id, {
        firstName,
        lastName,
        phone,
        status
      });

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const { id } = req.params;

      // Only superadmin and admins can approve users
      if (!['superadmin', 'hospital_admin', 'fleet_admin'].includes(req.user.role)) {
        return next(new AppError('You do not have permission to approve users', 403));
      }

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      await UserModel.update(id, { status: 'active' });

      res.json({
        success: true,
        message: 'User approved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async suspend(req, res, next) {
    try {
      const { id } = req.params;

      await UserModel.update(id, { status: 'suspended' });

      res.json({
        success: true,
        message: 'User suspended successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check permissions
      if (req.user.role !== 'superadmin' && user.organization_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      await UserModel.delete(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;

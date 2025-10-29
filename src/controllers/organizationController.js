const OrganizationModel = require('../models/Organization');
const { AppError } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

class OrganizationController {
  static async create(req, res, next) {
    try {
      const { name, type, address, city, state, zipCode, country, phone, email, licenseNumber } = req.body;

      // Auto-generate organization code
      const prefix = type === 'HOSPITAL' ? 'HOSP' : 'FLEET';
      const random = Math.floor(Math.random() * 9000) + 1000;
      const code = `${prefix}-${random}`;

      const orgId = await OrganizationModel.create({
        name,
        code,
        type: type.toLowerCase(),
        address,
        contactPerson: null,
        contactEmail: email,
        contactPhone: phone,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: { id: orgId, code, name, type }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { type, status, limit = 50, offset = 0 } = req.query;

      const filters = { type, status, limit, offset };
      const organizations = await OrganizationModel.findAll(filters);
      const total = await OrganizationModel.count({ type, status });

      res.json({
        success: true,
        data: {
          organizations,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + organizations.length) < total
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

      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        return next(new AppError('Organization not found', 404));
      }

      res.json({
        success: true,
        data: { organization }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, address, contactPerson, contactEmail, contactPhone, status } = req.body;

      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        return next(new AppError('Organization not found', 404));
      }

      await OrganizationModel.update(id, {
        name,
        address,
        contact_person: contactPerson,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        status
      });

      res.json({
        success: true,
        message: 'Organization updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        return next(new AppError('Organization not found', 404));
      }

      await OrganizationModel.delete(id);

      res.json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async suspend(req, res, next) {
    try {
      const { id } = req.params;

      await OrganizationModel.update(id, { status: 'suspended' });

      res.json({
        success: true,
        message: 'Organization suspended successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async activate(req, res, next) {
    try {
      const { id } = req.params;

      await OrganizationModel.update(id, { status: 'active' });

      res.json({
        success: true,
        message: 'Organization activated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizationController;

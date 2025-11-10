const OrganizationModel = require('../models/Organization');
const { AppError } = require('../middleware/auth');
const ActivityLogService = require('../services/activityLogService');
const { ORG_TYPES } = require('../config/constants');
const db = require('../config/database');

class OrganizationController {
  static async create(req, res, next) {
    try {
      const { name, type, address, city, state, zipCode, country, phone, email, licenseNumber, contactPerson } = req.body;

      // contact person is required
      const contactPersonValue = contactPerson || req.body.contact_person;
      if (!contactPersonValue) {
        return next(new AppError('Contact person is required', 400));
      }

      // Validate organization type (should not be superadmin)
      const orgType = (type || '').toUpperCase();
      if (orgType === 'SUPERADMIN') {
        return next(new AppError('Cannot create superadmin organization type via this endpoint', 400));
      }

      // email uniqueness check
      if (email) {
        const existing = await OrganizationModel.findByEmail(email);
        if (existing) return next(new AppError('Organization email already in use', 409));
      }

      // Auto-generate organization code
      const prefix = orgType === 'HOSPITAL' ? 'HOSP' : 'FLEET';
      const random = Math.floor(Math.random() * 9000) + 1000;
      const code = `${prefix}-${random}`;

      const orgId = await OrganizationModel.create({
        name,
        code,
        type: orgType,
        address,
        city,
        state,
        // support both postalCode and pincode naming
        postalCode: zipCode || req.body.postalCode || null,
        pincode: zipCode || req.body.postalCode || null,
        contactPerson: contactPersonValue,
        // include both canonical and legacy contact keys so DB mapping picks the right one
        email,
        phone,
        contact_email: email,
        contact_phone: phone,
        licenseNumber,
        status: 'active',
        is_active: true
      });

      // Log activity
      const newOrg = await OrganizationModel.findById(orgId);
      await ActivityLogService.logOrgCreated(req.user, newOrg, req);

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: { id: orgId, code, name, type: orgType }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { type, status, limit = 50, offset = 0, is_active } = req.query;
      // Build filters
      let filters = { type, status, limit, offset, is_active };

      // If user is not superadmin, normally only return their own organization.
      // However, allow requesting organizations by `type` (e.g. all fleet_owner or hospital)
      // so UI pages like Collaborations can fetch all fleets or all hospitals for partnership creation.
      if (req.user.role !== 'superadmin') {
        if (type) {
          // Respect type filter even for non-superadmin callers
          const orgs = await OrganizationModel.findAll(filters);
          const total = await OrganizationModel.count({ type, status, is_active });
          return res.json({
            success: true,
            data: {
              organizations: orgs,
              pagination: { total, limit: parseInt(limit), offset: parseInt(offset), hasMore: (parseInt(offset) + orgs.length) < total }
            }
          });
        }

        // No type requested: return only the caller's own organization
        const userOrg = await OrganizationModel.findById(req.user.organizationId);
        if (!userOrg) {
          return res.json({
            success: true,
            data: {
              organizations: [],
              pagination: { total: 0, limit: parseInt(limit), offset: parseInt(offset), hasMore: false }
            }
          });
        }

        return res.json({
          success: true,
          data: {
            organizations: [userOrg],
            pagination: { total: 1, limit: parseInt(limit), offset: parseInt(offset), hasMore: false }
          }
        });
      }

      // Superadmin sees all organizations
      const organizations = await OrganizationModel.findAll(filters);
      const total = await OrganizationModel.count({ type, status, is_active });

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

      // If user is not superadmin, they can only view their own organization
      if (req.user.role !== 'superadmin' && organization.id !== req.user.organizationId) {
        return next(new AppError('You do not have permission to view this organization', 403));
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
      const { name, address, contactPerson, contactEmail, contactPhone, status, city, state, zipCode, licenseNumber, email, phone } = req.body;

      // contact person is required on update as well
      const contactPersonValue = contactPerson || req.body.contact_person;
      if (!contactPersonValue) {
        return next(new AppError('Contact person is required', 400));
      }

      // email uniqueness check (exclude current org)
      // Check all possible email field names from frontend
      const emailToCheck = email || contactEmail || req.body.contact_email;
      if (emailToCheck) {
        const existing = await OrganizationModel.findByEmail(emailToCheck);
        if (existing && existing.id !== parseInt(id)) {
          return next(new AppError('Organization email already in use', 409));
        }
      }

      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        return next(new AppError('Organization not found', 404));
      }

      // Prepare phone value from multiple possible field names
      const phoneValue = phone || contactPhone || req.body.contact_phone;

      await OrganizationModel.update(id, {
        name,
        address,
        city,
        state,
        // update both postal_code and pincode variants via model mapping
        postal_code: zipCode || req.body.postalCode || null,
        pincode: zipCode || req.body.postalCode || null,
        license_number: licenseNumber,
        contact_person: contactPersonValue,
        // include both naming variants for email
        email: emailToCheck,
        contact_email: emailToCheck,
        // include both naming variants for phone
        phone: phoneValue,
        contact_phone: phoneValue,
        status
      });

      // Log activity
      const updatedOrg = await OrganizationModel.findById(id);
      await ActivityLogService.logOrgUpdated(req.user, updatedOrg, { name, address, city, state, email: emailToCheck, phone: phoneValue }, req);

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

      // Prevent deletion of superadmin organizations
      if (organization.type === 'superadmin' || organization.type === 'SUPERADMIN') {
        return next(new AppError('Cannot delete superadmin organization', 403));
      }

  // Soft delete: set is_active to false and mark status as suspended so UI/filtering is consistent
  await OrganizationModel.update(id, { is_active: false, status: 'suspended' });

      // Log activity
      await ActivityLogService.logOrgDeactivated(req.user, organization, req);

      res.json({
        success: true,
        message: 'Organization deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate an organization and cascade changes
   * - Set is_active = false
   * - Set all ambulances status to disabled
   * - Set all users status to suspended
   * - Cancel all partnerships
   * - Offboard all patients
   */
  static async deactivate(req, res, next) {
    const connection = await db.getConnection();
    
    try {
      const { id } = req.params;

      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        return next(new AppError('Organization not found', 404));
      }

      // Prevent deactivation of superadmin organizations
      if (organization.type === 'superadmin' || organization.type === 'SUPERADMIN') {
        return next(new AppError('Cannot deactivate superadmin organization', 403));
      }

      // Start transaction for atomic operations
      await connection.beginTransaction();

      // 1. Deactivate organization - mark both is_active and status so UI/filtering stays consistent
      await connection.query(
        "UPDATE organizations SET is_active = FALSE, status = 'suspended' WHERE id = ?",
        [id]
      );

      // 2. Disable all ambulances
      await connection.query(
        'UPDATE ambulances SET status = ? WHERE organization_id = ?',
        ['disabled', id]
      );

      // 3. Suspend all users
      await connection.query(
        'UPDATE users SET status = ? WHERE organization_id = ?',
        ['suspended', id]
      );

      // 4. Cancel all partnerships (where org is fleet or hospital)
      await connection.query(
        'UPDATE partnerships SET status = ? WHERE fleet_id = ? OR hospital_id = ?',
        ['inactive', id, id]
      );

      // 5. Offboard all patients by ending active sessions
      // Offboard sessions: set offboarded_at and status. Some DBs may not have legacy offboard_time column
      await connection.query(
        `UPDATE patient_sessions 
         SET status = 'offboarded', offboarded_at = NOW() 
         WHERE organization_id = ? AND status IN ('onboarded', 'in_transit')`,
        [id]
      );

      await connection.commit();

      // Log activity
      await ActivityLogService.logOrgDeactivated(req.user, organization, req);

      res.json({
        success: true,
        message: 'Organization deactivated successfully. All ambulances disabled, users suspended, partnerships cancelled, and patients offboarded.'
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }

  /**
   * Activate/reactivate an organization
   */
  static async activate(req, res, next) {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;

      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        return next(new AppError('Organization not found', 404));
      }

      // Start transaction to reactivate organization and related resources
      await connection.beginTransaction();

      // 1. Activate organization
      await connection.query(
        "UPDATE organizations SET is_active = TRUE, status = 'active' WHERE id = ?",
        [id]
      );

      // 2. Reactivate ambulances that were disabled and are approved (approved_at IS NOT NULL)
      // Leave ambulances that were pending approval unchanged
      await connection.query(
        `UPDATE ambulances SET status = 'available' WHERE organization_id = ? AND status = 'disabled' AND approved_at IS NOT NULL`,
        [id]
      );

      // 3. Reactivate users that were suspended due to organization deactivation
      // (this will set suspended users back to active so they can sign in)
      await connection.query(
        `UPDATE users SET status = 'active' WHERE organization_id = ? AND status = 'suspended'`,
        [id]
      );

      await connection.commit();

      // Log activity
      await ActivityLogService.logOrgActivated(req.user, organization, req);

      res.json({
        success: true,
        message: 'Organization activated successfully. Approved ambulances and previously suspended users have been reactivated where applicable.'
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
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
}

module.exports = OrganizationController;

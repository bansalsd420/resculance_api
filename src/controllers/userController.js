const UserModel = require('../models/User');
const { AppError } = require('../middleware/auth');
const { normalizeRole, normalizeStatus } = require('../utils/roleUtils');
const db = require('../config/database');
const NotificationService = require('../services/notificationService');

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
      // Preserve original role string to detect generic aliases like 'doctor'
      
      // If role provided as short string (e.g., DOCTOR), try to normalize using the requestor's orgType
      // Auto-generate username from email
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

      // Users can only create users for their own organization (except superadmin)
      // If frontend explicitly indicates organizationType === 'superadmin', prefer that for creating a global superadmin
      let organizationId = req.user.role === 'superadmin'
        ? req.body.organizationId
        : req.user.organizationId;

      // If frontend signalled this is a superadmin creation via organizationType, clear organizationId so it becomes global
      if (req.user.role === 'superadmin' && (req.body.organizationType || '').toString().toLowerCase() === 'superadmin') {
        organizationId = null;
      }

      // Determine organization type if needed and normalize the incoming role
      let orgType = req.user.organizationType;
      if (req.user.role === 'superadmin' && organizationId) {
        const [rows] = await db.query('SELECT type FROM organizations WHERE id = ? LIMIT 1', [organizationId]);
        orgType = rows && rows[0] ? rows[0].type : orgType;
      }

      const normalizedRole = await normalizeRole(role, orgType, organizationId);
      // If creating a global SUPERADMIN (no organizationId provided), attach the SYSTEM org
      // because the users table requires an organization_id. Prefer a real SYSTEM org if present.
      if ((normalizedRole || '').toString().toLowerCase() === 'superadmin') {
        if (!organizationId) {
          const [sysRows] = await db.query("SELECT id FROM organizations WHERE code = 'SYSTEM' LIMIT 1");
          if (sysRows && sysRows[0] && sysRows[0].id) {
            organizationId = sysRows[0].id;
          } else {
            return next(new AppError('System organization not found. Please run seeds or provide an organization for the superadmin.', 500));
          }
        }
      }
      const normalizedStatus = normalizeStatus(req.body.status) || 'pending_approval';

      const userId = await UserModel.create({
        email,
        username,
        password,
        firstName,
        lastName,
        role: normalizedRole,
        phone,
        organizationId,
        status: normalizedStatus,
        createdBy: req.user.id
      });

      // Notify superadmins if creating an admin account
      if (normalizedRole.includes('admin')) {
        try {
          const [orgRows] = await db.query('SELECT name FROM organizations WHERE id = ?', [organizationId]);
          const orgName = orgRows && orgRows[0] ? orgRows[0].name : 'Unknown';
          
          await NotificationService.notifySuperadminsNewAdmin({
            id: userId,
            role: normalizedRole,
            firstName,
            lastName,
            organizationName: orgName
          });
        } catch (notifError) {
          console.error('Failed to send new admin notification:', notifError);
        }
      }

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
      let { role, status, limit = 50, offset = 0 } = req.query;

      // Normalize incoming filter params
      status = normalizeStatus(status);

      // If requester is superadmin and they are NOT explicitly requesting superadmins,
      // require an organizationId to be provided to scope results. This prevents returning
      // all users across organizations when a superadmin has not selected an organization.
      // Exception: allow fetching all pending users without organizationId
  const originalRole = role;
  // Determine if caller is requesting pending users.
  // Accept both the raw query value 'pending' and the normalized 'pending_approval'.
  const rawStatus = req.query.status;
  const isPendingRequest = (rawStatus && String(rawStatus).toLowerCase() === 'pending') || (status && String(status).toLowerCase() === 'pending_approval');
      if (req.user.role === 'superadmin' && !(originalRole && String(originalRole).trim().toLowerCase() === 'superadmin') && !req.query.organizationId && !isPendingRequest) {
        return next(new AppError('organizationId is required when superadmin is viewing non-superadmin users', 400));
      }

      // Users can only view users from their organization (except superadmin)
      // For superadmin viewing pending users, don't scope to organization
      const organizationId = (req.user.role === 'superadmin' && isPendingRequest)
        ? undefined  // Allow viewing all pending users across organizations
        : req.user.role === 'superadmin'
        ? req.query.organizationId
        : req.user.organizationId;

  // Preserve original role string to detect generic aliases like 'doctor'

      // If role provided as short string (e.g., DOCTOR), try to normalize using the requestor's orgType
      if (role) {
        role = await normalizeRole(role, req.user.organizationType, organizationId);
      }

      // If caller requested generic 'doctor' (case-insensitive) then expand to both hospital and fleet doctor roles
      let roleFilter = role;
      if (originalRole && String(originalRole).trim().toLowerCase() === 'doctor') {
        roleFilter = ['hospital_doctor', 'fleet_doctor'];
      }

      const filters = { organizationId, role: roleFilter, status, limit, offset };
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
      const { firstName, lastName, phone, status, role, organizationId: bodyOrganizationId } = req.body;

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check permissions
      if (req.user.role !== 'superadmin' && user.organization_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      const updateData = { firstName, lastName, phone, status };

      // Allow updating profile image URL via admin/superadmin
      if (req.body.profileImageUrl) {
        updateData.profileImageUrl = req.body.profileImageUrl;
      }

      // Allow role updates only when requester is superadmin
      if (role && req.user.role === 'superadmin') {
        // Determine orgType for normalization: if superadmin provided organizationId in body, use that org's type
        let orgType = user.organization_type || user.organizationType || req.user.organizationType;
        let effectiveOrgId = bodyOrganizationId || user.organization_id || user.organizationId || null;
        if (effectiveOrgId) {
          const [rows] = await db.query('SELECT type FROM organizations WHERE id = ? LIMIT 1', [effectiveOrgId]);
          if (rows && rows[0]) orgType = rows[0].type;
        }

        const normalizedRole = await normalizeRole(role, orgType, effectiveOrgId);
        updateData.role = normalizedRole;

        // If role becomes superadmin and no organization specified, map to SYSTEM org if available
        if ((normalizedRole || '').toString().toLowerCase() === 'superadmin') {
          if (!effectiveOrgId) {
            const [sysRows] = await db.query("SELECT id FROM organizations WHERE code = 'SYSTEM' LIMIT 1");
            if (sysRows && sysRows[0] && sysRows[0].id) {
              updateData.organizationId = sysRows[0].id;
            } else {
              return next(new AppError('System organization not found. Cannot assign SUPERADMIN without an organization.', 500));
            }
          } else {
            updateData.organizationId = effectiveOrgId;
          }
        } else if (bodyOrganizationId && req.user.role === 'superadmin') {
          // superadmin may reassign organization for the user when changing role
          updateData.organizationId = bodyOrganizationId;
        }
      }

      await UserModel.update(id, updateData);

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadProfileImageForUser(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.file) return next(new AppError('No file uploaded', 400));

      // Permission: must be superadmin or admin of same org
      const target = await UserModel.findById(id);
      if (!target) return next(new AppError('User not found', 404));

      if (req.user.role !== 'superadmin' && target.organization_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      const filename = req.file.filename;
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${filename}`;

      // Remove old file if present
      if (target && target.profile_image_url) {
        try {
          const path = require('path');
          const fs = require('fs');
          const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'profiles');
          const old = target.profile_image_url;
          const oldFilename = old.includes('/uploads/profiles/') ? old.split('/uploads/profiles/').pop() : null;
          if (oldFilename) {
            const oldPath = path.join(uploadsDir, oldFilename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
        } catch (e) { console.warn('Failed to remove old profile image for user:', e.message); }
      }

      await UserModel.update(id, { profileImageUrl: fileUrl });

      res.json({ success: true, data: { profileImageUrl: fileUrl } });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check if user belongs to same organization (except superadmin)
      if (req.user.role !== 'superadmin' && user.organization_id !== req.user.organizationId) {
        return next(new AppError('You can only approve users from your organization', 403));
      }

      // Admins cannot approve other admins
      const { canApproveRole } = require('../config/permissions');
      if (!canApproveRole(req.user.role, user.role)) {
        return next(new AppError('You cannot approve users with admin roles', 403));
      }

      await UserModel.update(id, { status: 'active' });

      // Notify admins of the user's organization
      try {
        await NotificationService.notifyAdminUserApproved(user.organization_id, {
          id,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        });
      } catch (notifError) {
        console.error('Failed to send user approval notification:', notifError);
      }

      res.json({
        success: true,
        message: 'User approved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async suspend(req, res, next) {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Prevent users from deactivating their own account
      if (String(req.user.id) === String(user.id)) {
        return next(new AppError('You cannot deactivate your own account', 403));
      }

      const targetRole = (user.role || '').toString().toLowerCase();
      const requesterRole = (req.user.role || '').toString().toLowerCase();

      // Only a superadmin may deactivate accounts with admin privileges (any role that includes 'admin')
      if (targetRole.includes('admin') && requesterRole !== 'superadmin') {
        return next(new AppError('Only a superadmin can deactivate an admin account', 403));
      }

      // Non-superadmins may only suspend users within their own organization
      if (req.user.role !== 'superadmin' && user.organization_id !== req.user.organizationId) {
        return next(new AppError('You do not have permission to suspend users from other organizations', 403));
      }

      await connection.beginTransaction();

      // 1. Unassign from all ambulances
      const [assignments] = await connection.query(
        'SELECT ambulance_id FROM ambulance_assignments WHERE user_id = ?',
        [id]
      );

      if (assignments.length > 0) {
        await connection.query(
          'DELETE FROM ambulance_assignments WHERE user_id = ?',
          [id]
        );
      }

      // 2. Set user status to suspended
      await connection.query(
        'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
        ['suspended', id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'User suspended successfully',
        data: {
          userId: id,
          unassignedAmbulances: assignments.length
        }
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }

  static async activate(req, res, next) {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check if user is currently suspended
      if (user.status !== 'suspended') {
        return next(new AppError('Only suspended users can be activated', 400));
      }

      const targetRole = (user.role || '').toString().toLowerCase();
      const requesterRole = (req.user.role || '').toString().toLowerCase();

      // Only a superadmin may activate admin accounts
      if (targetRole.includes('admin') && requesterRole !== 'superadmin') {
        return next(new AppError('Only a superadmin can activate admin accounts', 403));
      }

      // Non-superadmins may only activate users within their own organization
      if (req.user.role !== 'superadmin' && user.organization_id !== req.user.organizationId) {
        return next(new AppError('You do not have permission to activate users from other organizations', 403));
      }

      await UserModel.update(id, { status: 'active' });

      res.json({
        success: true,
        message: 'User activated successfully'
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

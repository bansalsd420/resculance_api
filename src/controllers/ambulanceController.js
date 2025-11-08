const AmbulanceModel = require('../models/Ambulance');
const OrganizationModel = require('../models/Organization');
const UserModel = require('../models/User');
const { AppError } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const NotificationService = require('../services/notificationService');

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

      // Notify superadmins about new ambulance
      try {
        const org = await OrganizationModel.findById(organizationId);
        await NotificationService.notifySuperadminsNewAmbulance({
          id: ambulanceId,
          ambulance_code: ambulanceCode,
          organizationName: org.name
        });
      } catch (notifError) {
        console.error('Failed to send new ambulance notification:', notifError);
      }

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
      const { isMedicalStaff } = require('../config/permissions');

      // Medical staff (doctors/paramedics) can only see ambulances assigned to them
      if (isMedicalStaff(req.user.role)) {
        const ambulances = await AmbulanceModel.findMappedToUser(req.user.id);
        return res.json({
          success: true,
          data: {
            ambulances,
            pagination: {
              total: ambulances.length,
              limit: parseInt(limit),
              offset: 0,
              hasMore: false
            }
          }
        });
      }

      // Users see only their organization's ambulances (except superadmin)
      // For superadmin, require explicit organizationId to avoid exposing all ambulances across orgs
      let organizationId;
      if (req.user.role === 'superadmin') {
        // For regular (non-partnered) views we require an explicit organizationId selection from the UI.
        // However, when requesting the partnered view, the frontend will pass `partnered=true` and a `hospitalId`.
        // In that case we should not early-return just because organizationId is missing.
        if (!req.query.organizationId && req.query.partnered !== 'true') {
          // Non-breaking behavior: return empty result set instead of error when no org selected for normal views.
          return res.json({
            success: true,
            data: {
              ambulances: [],
              pagination: {
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: false
              }
            }
          });
        }
        organizationId = req.query.organizationId;
      } else {
        organizationId = req.user.organizationId;
      }

      // For partnered view, we should not restrict ambulances by organizationId (which would be a hospital id)
      // Instead, use partneredHospitalId to select fleet ambulances that are partnered with a hospital.
      let filters = { status, limit, offset };

      // Support partnered ambulances when requested (e.g., hospital viewing partnered fleets)
      if (req.query.partnered === 'true') {
        // If requester is superadmin they must pass organizationId as hospital id to scope partnered ambulances
        let hospitalIdForPartnered;
        if (req.user.role === 'superadmin') {
          hospitalIdForPartnered = req.query.hospitalId;
          if (!hospitalIdForPartnered) {
            return res.json({ success: true, data: { ambulances: [], pagination: { total: 0, limit: parseInt(limit), offset: parseInt(offset), hasMore: false } } });
          }
        } else if (req.user.organizationType === 'hospital') {
          hospitalIdForPartnered = req.user.organizationId;
        }

        if (hospitalIdForPartnered) {
          filters.partneredHospitalId = hospitalIdForPartnered;
          // For hospitals (and superadmin acting on behalf of a hospital), partnered ambulances
          // that belong to fleet owners should only be visible when they are approved/available.
          // Enforce this on the backend to prevent data leaks.
          filters.onlyApprovedForPartnered = true;
        }
      } else {
        // regular non-partnered listing: scope by organizationId
        filters.organizationId = organizationId;
      }
      const ambulances = await AmbulanceModel.findAll(filters);

      // Build matching count filters so pagination numbers align with the listing
      const countFilters = {};
      if (filters.organizationId) countFilters.organizationId = filters.organizationId;
      if (filters.status) countFilters.status = filters.status;
      if (filters.partneredHospitalId) {
        countFilters.partneredHospitalId = filters.partneredHospitalId;
        // ensure count uses same visibility restriction as listing
        if (filters.onlyApprovedForPartnered !== false) countFilters.onlyApprovedForPartnered = true;
      }

      const total = await AmbulanceModel.count(countFilters);

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


      // Validate status updates
      if (status === 'pending_approval') {
        return next(new AppError('Cannot set status to pending_approval', 400));
      }

      if (status === 'inactive' && req.user.role !== 'superadmin') {
        return next(new AppError('Only superadmin can set ambulance to inactive', 403));
      }

      // If a hospital is attempting to set ambulance status to 'active', ensure a partnership exists
      if ((req.user.organizationType === 'hospital') && status === 'active') {
        // ambulance must be partnered with this hospital
        const partnershipCheck = await require('../models/Partnership').findByFleetAndHospital(ambulance.organization_id, req.user.organizationId);
        if (!partnershipCheck) {
          return next(new AppError('Cannot activate ambulance: no partnership exists between your hospital and the fleet owner', 403));
        }

        // Ensure ambulance is not locked by another hospital
        if (ambulance.current_hospital_id && ambulance.current_hospital_id !== req.user.organizationId) {
          return next(new AppError('Ambulance is currently active for another hospital', 403));
        }

        // Set current_hospital_id to lock ambulance for this hospital
        await AmbulanceModel.update(id, {
          vehicle_model: vehicleModel,
          vehicle_type: vehicleType,
          status,
          current_hospital_id: req.user.organizationId
        });

        return res.json({ success: true, message: 'Ambulance updated and locked for your hospital' });
      }

      // When setting status to 'available', clear any hospital lock
      if (status === 'available') {
        await AmbulanceModel.update(id, {
          vehicle_model: vehicleModel,
          vehicle_type: vehicleType,
          status,
          current_hospital_id: null
        });
        return res.json({ success: true, message: 'Ambulance updated and made available' });
      }

      // Fleet owners can always change status; if they change a currently-locked ambulance, include a warning
      let warning = null;
      if (req.user.organizationType === 'fleet_owner' && ambulance.current_hospital_id) {
        warning = { message: 'This ambulance is currently active for a hospital', lockedByHospitalId: ambulance.current_hospital_id };
      }

      await AmbulanceModel.update(id, {
        vehicle_model: vehicleModel,
        vehicle_type: vehicleType,
        status
      });

      const payload = { success: true, message: 'Ambulance updated successfully' };
      if (warning) payload.warning = warning;
      return res.json(payload);

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

      // Notify admins of the ambulance's organization
      try {
        await NotificationService.notifyAdminAmbulanceApproved(ambulance.organization_id, {
          id,
          ambulance_code: ambulance.ambulance_code
        });
      } catch (notifError) {
        console.error('Failed to send ambulance approval notification:', notifError);
      }

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
      const { userId, assigningOrganizationId } = req.body;

      console.log('[assignUser] Request:', { ambulanceId: id, userId, assigningOrganizationId, requesterRole: req.user.role, requesterOrgId: req.user.organizationId });

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

      // Prevent assignments to ambulances that are not yet approved
      if ((ambulance.status || '').toString().toLowerCase() === 'pending_approval') {
        return next(new AppError('Cannot assign staff to an ambulance that is pending approval', 400));
      }

      // Determine which organization is assigning and validate permissions
      let assigningOrgToUse = null;
      let hospitalIdToValidate = null;

      if (req.user.role === 'superadmin') {
        // Superadmin case: must provide assigningOrganizationId to assign hospital staff
        if (!assigningOrganizationId) {
          // If no assigningOrganizationId provided, superadmin is assigning fleet staff (no partnership needed)
          console.log('[assignUser] Superadmin assigning without org context - treating as fleet assignment');
        } else {
          // Superadmin is assigning on behalf of a specific organization
          const org = await OrganizationModel.findById(assigningOrganizationId);
          if (!org) {
            return next(new AppError('Assigning organization not found', 404));
          }
          assigningOrgToUse = assigningOrganizationId;
          
          console.log('[assignUser] Superadmin assigning on behalf of org:', { orgId: assigningOrganizationId, orgType: org.type });
          
          // If assigning org is a hospital, we need to validate partnership
          const orgType = (org.type || '').toString().toLowerCase();
          if (orgType === 'hospital') {
            hospitalIdToValidate = assigningOrganizationId;
          }
        }
      } else if (req.user.organizationType === 'hospital') {
        // Regular hospital user assigning their own staff
        hospitalIdToValidate = req.user.organizationId;
      }

      // If a hospital is involved, validate permissions
      if (hospitalIdToValidate) {
        console.log('[assignUser] Hospital validation needed:', { ambulanceOrgId: ambulance.organization_id, ambulanceOrgType: ambulance.organization_type, hospitalId: hospitalIdToValidate });
        
        // Case 1: Hospital assigning to its OWN ambulance - no partnership needed
        if (hospitalIdToValidate === ambulance.organization_id) {
          console.log('[assignUser] Hospital assigning to its own ambulance - allowed');
        }
        // Case 2: Hospital assigning to a FLEET OWNER's ambulance - partnership required
        else if (ambulance.organization_type === 'fleet_owner') {
          console.log('[assignUser] Validating partnership for fleet ambulance:', { fleetId: ambulance.organization_id, hospitalId: hospitalIdToValidate });
          const partnership = await require('../models/Partnership').findByFleetAndHospital(ambulance.organization_id, hospitalIdToValidate);
          console.log('[assignUser] Partnership result:', partnership);
          
          if (!partnership) {
            return next(new AppError('Your hospital does not have a partnership with this ambulance\'s fleet owner', 403));
          }
          
          // If ambulance is currently locked by another hospital, prevent assignment
          if (ambulance.current_hospital_id && ambulance.current_hospital_id !== hospitalIdToValidate) {
            return next(new AppError('Ambulance is currently active for another hospital and cannot be assigned', 403));
          }
        }
        // Case 3: Hospital trying to assign to another hospital's ambulance - not allowed
        else {
          console.log('[assignUser] Hospital trying to assign to another hospital\'s ambulance - blocked');
          return next(new AppError('You cannot assign staff to another organization\'s ambulance', 403));
        }
      }

      await AmbulanceModel.assignUser(id, userId, req.user.id, assigningOrgToUse);

      // Notify the user about ambulance assignment
      try {
        await NotificationService.notifyUserAmbulanceAssignment(userId, {
          id,
          ambulance_code: ambulance.ambulance_code
        });
      } catch (notifError) {
        console.error('Failed to send ambulance assignment notification:', notifError);
      }

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

      // Ensure assignment exists and was created by the same organization as the requester
      const [rows] = await require('../config/database').query(
        `SELECT assigning_organization_id FROM ambulance_assignments WHERE ambulance_id = ? AND user_id = ? AND is_active = TRUE LIMIT 1`,
        [id, userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      const assignment = rows[0];

      // Authorization rules:
      // - Superadmin can always unassign
      // - The assigning organization can unassign (original behavior)
      // - Fleet owner that owns the ambulance can unassign assignments on their ambulance
      const canBypass = req.user.role === 'superadmin';

      // check ambulance owner for fleet owner bypass
      let ambulanceOwnerOrgId = null;
      try {
        const [ambRows] = await require('../config/database').query(`SELECT organization_id FROM ambulances WHERE id = ? LIMIT 1`, [id]);
        if (ambRows && ambRows[0]) ambulanceOwnerOrgId = ambRows[0].organization_id;
      } catch (e) {
        // ignore and continue; authorization will fall back to strict check
        console.error('[unassignUser] failed to read ambulance owner', e);
      }

      const isAssigningOrg = parseInt(assignment.assigning_organization_id) === parseInt(req.user.organizationId);
      const isFleetOwnerOfAmbulance = req.user.organizationType === 'fleet_owner' && parseInt(ambulanceOwnerOrgId) === parseInt(req.user.organizationId);

      if (!canBypass && !isAssigningOrg && !isFleetOwnerOfAmbulance) {
        return res.status(403).json({ success: false, message: 'You are not authorized to remove this assignment' });
      }

      const ok = await AmbulanceModel.unassignUser(id, userId);
      if (!ok) {
        return res.status(500).json({ success: false, message: 'Failed to unassign user' });
      }

      res.json({ success: true, message: 'User unassigned from ambulance successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignedUsers(req, res, next) {
    try {
      const { id } = req.params;

      // Use the assignment visibility rules: hospitals only see their org's assignments, fleet owners and superadmin can see all for owned ambulances
      const AssignmentModel = require('../models/AmbulanceAssignment');
      const rows = await AssignmentModel.findForAmbulance({ ambulanceId: id, requester: req.user });

      // Map DB fields (snake_case) to frontend-friendly camelCase and normalize role label
      const mapRoleLabel = (roleKey) => {
        if (!roleKey) return '';
        const r = roleKey.toString().toLowerCase();
        if (r.includes('doctor')) return 'Doctor';
        if (r.includes('paramedic')) return 'Paramedic';
        if (r.includes('driver')) return 'Driver';
        return roleKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      const users = rows.map(row => ({
        id: row.user_id || row.id,
        firstName: row.first_name || row.firstName || null,
        lastName: row.last_name || row.lastName || null,
        email: row.email || null,
        phone: row.phone || null,
        role: mapRoleLabel(row.role || row.user_role || ''),
        roleKey: row.role || row.user_role || '',
        assignedAt: row.assigned_at || row.assignedAt || null,
        assigningOrganizationId: row.assigning_organization_id || row.assigningOrganizationId || null,
        assigningOrganizationName: row.assigning_org_name || row.assigningOrganizationName || null
      }));

      res.json({ success: true, data: { users } });
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

  // Fetch ambulances assigned to a specific user (admin/higher roles can query other users)
  static async getAmbulancesForUser(req, res, next) {
    try {
      const { userId } = req.params;
      const targetUser = await UserModel.findById(userId);
      if (!targetUser) return next(new AppError('User not found', 404));

      // Only allow superadmin or users within the same organization to query other users' assignments
      const targetOrgId = targetUser.organization_id || targetUser.organizationId || null;
      if (req.user.role !== 'superadmin' && req.user.organizationId !== targetOrgId) {
        return next(new AppError('Access denied', 403));
      }

      const ambulances = await AmbulanceModel.findMappedToUser(userId);
      res.json({ success: true, data: { ambulances } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AmbulanceController;

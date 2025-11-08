const CollaborationRequestModel = require('../models/CollaborationRequest');
const OrganizationModel = require('../models/Organization');
const AmbulanceModel = require('../models/Ambulance');
const PartnershipModel = require('../models/Partnership');
const db = require('../config/database');
const { AppError } = require('../middleware/auth');
const { audit } = require('../utils/audit');
const NotificationService = require('../services/notificationService');
const { emitBulkNotifications } = require('../socket/socketHandler');

class CollaborationController {
  static async create(req, res, next) {
    try {
      const { fleetId, hospitalId: bodyHospitalId, requestType = 'partnership', message, terms } = req.body;

      // Find fleet by ID
      const fleet = await OrganizationModel.findById(fleetId);
      if (!fleet || fleet.type !== 'fleet_owner') {
        return next(new AppError('Fleet owner not found', 404));
      }

      // Allow superadmin to create request on behalf of a hospital by passing hospitalId in the body
      const hospitalId = (req.user.role === 'superadmin' && bodyHospitalId) ? bodyHospitalId : req.user.organizationId;

      const requestId = await CollaborationRequestModel.create({
        hospitalId,
        fleetId: fleet.id,
        requestType,
        message,
        terms,
        requestedBy: req.user.id,
        status: 'pending'
      });

      // Notify fleet admins about new collaboration request
      try {
        const hospital = await OrganizationModel.findById(hospitalId);
        await NotificationService.notifyAdminsCollaborationRequest(fleet.id, {
          id: requestId,
          requesterOrgName: hospital.name
        });
      } catch (notifError) {
        console.error('Failed to send collaboration request notification:', notifError);
      }

      res.status(201).json({
        success: true,
        message: 'Collaboration request sent successfully',
        data: { requestId }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const filters = { status, limit, offset };

      // Superadmin sees all requests
      if (req.user.role !== 'superadmin') {
        // Hospital users see requests they created
        if (req.user.organizationType === 'hospital') {
          filters.hospitalId = req.user.organizationId;
        }

        // Fleet owner users see requests sent to them
        if (req.user.organizationType === 'fleet_owner') {
          filters.fleetId = req.user.organizationId;
        }
      }

      const requests = await CollaborationRequestModel.findAll(filters);
      const total = await CollaborationRequestModel.count(filters);

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + requests.length) < total
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

      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      // Check access permissions
      if (req.user.role !== 'superadmin' &&
          request.hospital_id !== req.user.organizationId &&
          request.fleet_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      res.json({
        success: true,
        data: { request }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyPartnerships(req, res, next) {
    try {
      // Hospitals should see partnerships where they are hospital; fleet owners should see where they are fleet
      if (req.user.organizationType === 'hospital') {
        const partnerships = await PartnershipModel.findActiveByHospital(req.user.organizationId);
        return res.json({ success: true, data: { partnerships } });
      }

      if (req.user.organizationType === 'fleet_owner') {
        const partnerships = await PartnershipModel.findActiveByFleet(req.user.organizationId);
        return res.json({ success: true, data: { partnerships } });
      }

      // superadmin: return all partnerships
      const [rows] = await db.query('SELECT p.*, f.name as fleet_name, h.name as hospital_name FROM partnerships p JOIN organizations f ON p.fleet_id = f.id JOIN organizations h ON p.hospital_id = h.id');
      return res.json({ success: true, data: { partnerships: rows } });
    } catch (error) {
      next(error);
    }
  }

  static async accept(req, res, next) {
    try {
      const { id } = req.params;
      const { rejectedReason } = req.body;

      // Only fleet owner can accept requests (superadmin may also perform this action)
      if (req.user.role !== 'superadmin' && req.user.organizationType !== 'fleet_owner') {
        return next(new AppError('Only fleet owners can accept collaboration requests', 403));
      }

      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      // Allow superadmin to act regardless of organization ownership
      if (req.user.role !== 'superadmin' && request.fleet_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      if (request.status !== 'pending') {
        return next(new AppError('Request has already been processed', 400));
      }

      // Perform accept + partnership creation in a transaction to avoid partial states
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Update request to approved
        const [acceptResult] = await conn.query(
          `UPDATE collaboration_requests SET status = 'approved', approved_by = ?, approved_at = NOW(), rejected_reason = ? WHERE id = ?`,
          [req.user.id, rejectedReason, id]
        );
        if (!acceptResult.affectedRows) {
          await conn.rollback();
          return next(new AppError('Failed to approve collaboration request', 500));
        }

        // Create or ensure partnership mapping between fleet and hospital when accepted
        // Use raw queries via the same connection for atomicity and add an audit log entry
        const [existing] = await conn.query(`SELECT * FROM partnerships WHERE fleet_id = ? AND hospital_id = ? LIMIT 1`, [request.fleet_id, request.hospital_id]);
        if (!existing || existing.length === 0) {
          try {
            const [ins] = await conn.query(`INSERT INTO partnerships (fleet_id, hospital_id, status, created_by, created_at) VALUES (?, ?, 'active', ?, NOW())`, [request.fleet_id, request.hospital_id, req.user.id]);
            const partnershipId = ins.insertId;
            await conn.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, 'create_partnership', 'partnership', ?, ?, NOW())`, [req.user.id, partnershipId, JSON.stringify({ fleetId: request.fleet_id, hospitalId: request.hospital_id, status: 'active' })]);
          } catch (e) {
            // If duplicate entry happened due to race, treat as success
            if (e && e.code === 'ER_DUP_ENTRY') {
              // noop
            } else {
              throw e;
            }
          }
        } else if (existing[0].status !== 'active') {
          await conn.query(`UPDATE partnerships SET status = 'active' WHERE id = ?`, [existing[0].id]);
          try {
            await conn.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at) VALUES (?, 'activate_partnership', 'partnership', ?, ?, ?, NOW())`, [req.user.id, existing[0].id, JSON.stringify({ status: existing[0].status }), JSON.stringify({ status: 'active' })]);
          } catch (e) {
            console.error('Failed to write audit log during partnership activation in accept flow:', e);
          }
        }

        await conn.commit();

        // Notify both parties and superadmins about accepted partnership
        try {
          const hospital = await OrganizationModel.findById(request.hospital_id);
          const fleet = await OrganizationModel.findById(request.fleet_id);
          
          // Notify hospital admins who sent the request
          await NotificationService.notifyAdminsCollaborationAccepted(request.hospital_id, {
            id,
            recipientOrgName: fleet.name
          });

          // Notify superadmins
          await NotificationService.notifySuperadminsPartnershipAccepted({
            id,
            requesterOrgName: hospital.name,
            recipientOrgName: fleet.name
          });
        } catch (notifError) {
          console.error('Failed to send partnership acceptance notifications:', notifError);
        }

        res.json({ success: true, message: 'Collaboration request accepted successfully' });
      } catch (txErr) {
        try { await conn.rollback(); } catch (e) { console.error('Rollback failed', e); }
        console.error('Transaction failed while accepting collaboration:', txErr);
        return next(txErr);
      } finally {
        conn.release();
      }
    } catch (error) {
      next(error);
    }
  }

  static async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { rejectedReason } = req.body;

      // Only fleet owner can reject requests (superadmin may also perform this action)
      if (req.user.role !== 'superadmin' && req.user.organizationType !== 'fleet_owner') {
        return next(new AppError('Only fleet owners can reject collaboration requests', 403));
      }

      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      // Allow superadmin to act regardless of organization ownership
      if (req.user.role !== 'superadmin' && request.fleet_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      if (request.status !== 'pending') {
        return next(new AppError('Request has already been processed', 400));
      }

      const ok = await CollaborationRequestModel.reject(id, req.user.id, rejectedReason);

      // Audit log the rejection
      try {
        await db.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at) VALUES (?, 'reject_collaboration_request', 'collaboration_request', ?, ?, ?, NOW())`, [req.user.id, id, JSON.stringify({ status: 'pending' }), JSON.stringify({ status: 'rejected', rejectedReason })]);
      } catch (e) {
        console.error('Failed to write audit log for collaboration rejection:', e);
      }

      if (!ok) {
        return next(new AppError('Failed to reject collaboration request', 500));
      }

      res.json({
        success: true,
        message: 'Collaboration request rejected'
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const { id } = req.params;

      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      // Allow superadmin, the requesting hospital, or the fleet owner to cancel
      const isRequesterHospital = request.hospital_id === req.user.organizationId;
      const isFleetOwner = request.fleet_id === req.user.organizationId;
      if (!(req.user.role === 'superadmin' || isRequesterHospital || isFleetOwner)) {
        return next(new AppError('Only the requesting hospital, the fleet owner or superadmin can cancel this request', 403));
      }

      // If pending -> simple cancel of the request
      if (request.status === 'pending') {
        const ok = await CollaborationRequestModel.cancel(id);

        // Audit log the cancellation
        await audit({ userId: req.user.id, action: 'cancel_collaboration_request', entityType: 'collaboration_request', entityId: id, oldValues: { status: request.status }, newValues: { status: 'cancelled' } });

        if (!ok) {
          return next(new AppError('Failed to cancel collaboration request', 500));
        }

        return res.json({ success: true, message: 'Collaboration request cancelled' });
      }

      // If approved -> cancel should deactivate the partnership (fleet <-> hospital)
      if (request.status === 'approved') {
        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();

          // Mark collaboration request as cancelled
          const [upd] = await conn.query(`UPDATE collaboration_requests SET status = 'cancelled' WHERE id = ?`, [id]);
          if (!upd.affectedRows) {
            await conn.rollback();
            return next(new AppError('Failed to cancel collaboration request', 500));
          }

          // Deactivate any active partnership for the fleet/hospital pair
          const [partRows] = await conn.query(`SELECT * FROM partnerships WHERE fleet_id = ? AND hospital_id = ? LIMIT 1`, [request.fleet_id, request.hospital_id]);
          if (partRows && partRows.length) {
            const part = partRows[0];
            if (part.status === 'active') {
              await conn.query(`UPDATE partnerships SET status = 'cancelled' WHERE id = ?`, [part.id]);
              try {
                await audit({ userId: req.user.id, action: 'cancel_partnership', entityType: 'partnership', entityId: part.id, oldValues: { status: part.status }, newValues: { status: 'cancelled' } });
              } catch (e) {
                console.error('Failed to write audit log for partnership cancellation:', e);
              }
            }
          }

          // Release ambulance locks that are currently assigned to the hospital for this partnership
          // but only if they are not in an active patient session (onboarded / in_transit).
          try {
            const [ambRows] = await conn.query(`SELECT id FROM ambulances WHERE organization_id = ? AND current_hospital_id = ?`, [request.fleet_id, request.hospital_id]);
            for (const a of ambRows) {
              const ambulanceId = a.id;
              const [psRows] = await conn.query(`SELECT COUNT(*) as cnt FROM patient_sessions WHERE ambulance_id = ? AND status IN ('onboarded', 'in_transit')`, [ambulanceId]);
              const cnt = psRows && psRows[0] ? psRows[0].cnt : 0;
              if (cnt === 0) {
                // Safe to release ambulance from the hospital
                await conn.query(`UPDATE ambulances SET current_hospital_id = NULL WHERE id = ?`, [ambulanceId]);
                try {
                  await audit({ userId: req.user.id, action: 'release_ambulance_from_hospital', entityType: 'ambulance', entityId: ambulanceId, oldValues: { current_hospital_id: request.hospital_id }, newValues: { current_hospital_id: null } });
                } catch (e) {
                  console.error('Failed to write audit log for ambulance release during partnership cancellation:', e);
                }
              }
            }
          } catch (e) {
            console.error('Failed while releasing ambulances during partnership cancellation:', e);
            // Do not fail the whole transaction for audit/logging issues, but we should continue
          }

          // Deactivate any assignments that hospital staff had on this fleet's ambulances.
          // We will:
          //  - find ambulance_assignments where the ambulance belongs to the fleet (fleet_id)
          //  - and the assigned user belongs to the hospital being un-partnered (hospital_id)
          //  - skip unassigning if the ambulance currently has an active patient session
          //  - mark the assignment is_active = FALSE and write an audit entry per deactivation
          try {
            const [assignRows] = await conn.query(`
              SELECT aa.id as assignment_id, aa.ambulance_id, aa.user_id
              FROM ambulance_assignments aa
              JOIN ambulances a ON aa.ambulance_id = a.id
              JOIN users u ON aa.user_id = u.id
              WHERE a.organization_id = ? AND u.organization_id = ? AND aa.is_active = TRUE
            `, [request.fleet_id, request.hospital_id]);

            for (const ass of assignRows) {
              try {
                const ambulanceId = ass.ambulance_id;
                // If ambulance has an active patient session, skip unassign for safety
                const [psRows2] = await conn.query(`SELECT COUNT(*) as cnt FROM patient_sessions WHERE ambulance_id = ? AND status IN ('onboarded', 'in_transit')`, [ambulanceId]);
                const cnt2 = psRows2 && psRows2[0] ? psRows2[0].cnt : 0;
                if (cnt2 > 0) {
                  // Log that we skipped deactivation due to active session
                  try {
                    await audit({ userId: req.user.id, action: 'skip_unassign_active_session', entityType: 'ambulance_assignment', entityId: ass.assignment_id, oldValues: { ambulance_id: ambulanceId, user_id: ass.user_id }, newValues: { skipped: true } });
                  } catch (e) {
                    console.error('Failed to write audit log for skipped unassign during partnership cancellation:', e);
                  }
                  continue;
                }

                // Deactivate assignment
                const [updAss] = await conn.query(`UPDATE ambulance_assignments SET is_active = FALSE WHERE id = ?`, [ass.assignment_id]);
                if (updAss && updAss.affectedRows) {
                  try {
                    await audit({ userId: req.user.id, action: 'auto_unassign_on_partnership_cancel', entityType: 'ambulance_assignment', entityId: ass.assignment_id, oldValues: { is_active: true }, newValues: { is_active: false } });
                  } catch (e) {
                    console.error('Failed to write audit log for auto-unassign during partnership cancellation:', e);
                  }
                }
              } catch (innerErr) {
                console.error('Failed while deactivating an assignment during partnership cancellation:', innerErr);
                // continue with other assignments
              }
            }
          } catch (e) {
            console.error('Failed while deactivating hospital staff assignments during partnership cancellation:', e);
            // Do not fail the whole transaction for assignment cleanup issues; continue
          }

          // Also write audit log for collaboration request cancellation referencing previous approved state
          try {
            await audit({ userId: req.user.id, action: 'cancel_collaboration_request', entityType: 'collaboration_request', entityId: id, oldValues: { status: request.status }, newValues: { status: 'cancelled' } });
          } catch (e) {
            console.error('Failed to write audit log for collaboration cancellation (approved flow):', e);
          }

          await conn.commit();

          return res.json({ success: true, message: 'Collaboration request cancelled and partnership deactivated' });
        } catch (txErr) {
          try { await conn.rollback(); } catch (e) { console.error('Rollback failed', e); }
          console.error('Transaction failed while cancelling approved collaboration:', txErr);
          return next(txErr);
        } finally {
          conn.release();
        }
      }

      // Other statuses cannot be cancelled
      return next(new AppError('Only pending or approved requests can be cancelled', 400));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CollaborationController;

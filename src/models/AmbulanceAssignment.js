const db = require('../config/database');

class AmbulanceAssignmentModel {
  // Create or reactivate an assignment
  static async create({ ambulanceId, userId, assigningOrganizationId, assignedBy, role }) {
    try {
      const [result] = await db.query(
        `INSERT INTO ambulance_assignments (ambulance_id, user_id, assigning_organization_id, assigned_by, role, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE is_active = TRUE, assigned_at = NOW(), assigned_by = VALUES(assigned_by), role = VALUES(role)`,
        [ambulanceId, userId, assigningOrganizationId, assignedBy, role]
      );
      return result.insertId || true;
    } catch (err) {
      // If the table doesn't exist, return a clear failure object so callers can handle gracefully.
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('ambulance_assignments table does not exist. Run migrations to create it.');
        return { success: false, reason: 'missing_table' };
      }
      throw err;
    }
  }

  // Deactivate/unassign - enforces that only the assigning organization can deactivate
  static async deactivate({ ambulanceId, userId, requestedByOrgId }) {
    try {
      const [rows] = await db.query(
        `SELECT id, assigning_organization_id FROM ambulance_assignments WHERE ambulance_id = ? AND user_id = ? AND is_active = TRUE LIMIT 1`,
        [ambulanceId, userId]
      );

      if (rows.length === 0) {
        return { success: false, reason: 'assignment_not_found' };
      }

      const assignment = rows[0];
      if (assignment.assigning_organization_id !== parseInt(requestedByOrgId)) {
        return { success: false, reason: 'not_authorized' };
      }

      const [res] = await db.query(
        `UPDATE ambulance_assignments SET is_active = FALSE WHERE id = ?`,
        [assignment.id]
      );

      return { success: res.affectedRows > 0 };
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('ambulance_assignments table does not exist. Run migrations to create it.');
        return { success: false, reason: 'missing_table' };
      }
      throw err;
    }
  }

  // Get assignments for an ambulance respecting requester visibility rules
  static async findForAmbulance({ ambulanceId, requester }) {
    // requester: { id, role, organizationId, organizationType }
    // Hospitals should only see assignments created by their own org
    // Fleet owners (who own the ambulance) and superadmin can see all

    if (!requester) {
      // conservative: return no details
      return [];
    }

    try {
      if (requester.role === 'superadmin') {
        const [rows] = await db.query(
          `SELECT aa.*, u.first_name, u.last_name, u.email, u.phone, org.name as assigning_org_name
           FROM ambulance_assignments aa
           JOIN users u ON aa.user_id = u.id
           JOIN organizations org ON aa.assigning_organization_id = org.id
           WHERE aa.ambulance_id = ? AND aa.is_active = TRUE`,
          [ambulanceId]
        );
        return rows;
      }

      if (requester.organizationType === 'hospital') {
        const [rows] = await db.query(
          `SELECT aa.*, u.first_name, u.last_name, org.name as assigning_org_name
           FROM ambulance_assignments aa
           JOIN users u ON aa.user_id = u.id
           JOIN organizations org ON aa.assigning_organization_id = org.id
           WHERE aa.ambulance_id = ? AND aa.is_active = TRUE AND aa.assigning_organization_id = ?`,
          [ambulanceId, requester.organizationId]
        );
        return rows;
      }

      if (requester.organizationType === 'fleet_owner') {
        const [ambRows] = await db.query(`SELECT organization_id FROM ambulances WHERE id = ? LIMIT 1`, [ambulanceId]);
        if (ambRows.length === 0) return [];
        const ambulance = ambRows[0];
        if (ambulance.organization_id !== requester.organizationId) {
          // not the owner; don't expose assignments
          return [];
        }

        const [rows] = await db.query(
          `SELECT aa.*, u.first_name, u.last_name, u.email, u.phone, org.name as assigning_org_name
           FROM ambulance_assignments aa
           JOIN users u ON aa.user_id = u.id
           JOIN organizations org ON aa.assigning_organization_id = org.id
           WHERE aa.ambulance_id = ? AND aa.is_active = TRUE`,
          [ambulanceId]
        );
        return rows;
      }
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('ambulance_assignments table does not exist. Run migrations to create it.');
        return [];
      }
      throw err;
    }

    // Default: no access
    return [];
  }

  static async findActiveByAmbulanceAndOrg(ambulanceId, orgId) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM ambulance_assignments WHERE ambulance_id = ? AND assigning_organization_id = ? AND is_active = TRUE`,
        [ambulanceId, orgId]
      );
      return rows;
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('ambulance_assignments table does not exist. Run migrations to create it.');
        return [];
      }
      throw err;
    }
  }
}

module.exports = AmbulanceAssignmentModel;

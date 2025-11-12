const db = require('../config/database');

class AmbulanceModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO ambulances (organization_id, ambulance_code, registration_number, vehicle_model, vehicle_type, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.organizationId,
        data.ambulanceCode,
        data.registrationNumber,
        data.vehicleModel,
        data.vehicleType,
        data.status || 'pending_approval',
        data.createdBy
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT a.*, a.organization_id as organizationId, a.current_hospital_id as currentHospitalId,
              o.name as organization_name, o.code as organization_code, o.type as organization_type,
              ch.name as current_hospital_name
       FROM ambulances a
       JOIN organizations o ON a.organization_id = o.id
       LEFT JOIN organizations ch ON a.current_hospital_id = ch.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await db.query(
      `SELECT a.*, o.name as organization_name, o.code as organization_code, o.type as organization_type
       FROM ambulances a
       JOIN organizations o ON a.organization_id = o.id
       WHERE a.ambulance_code = ?`,
      [code]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
  let query = `SELECT a.*, a.organization_id as organizationId, a.current_hospital_id as currentHospitalId,
            o.name as organization_name, o.code as organization_code, o.type as organization_type,
            ch.name as current_hospital_name
                 FROM ambulances a
                 LEFT JOIN organizations o ON a.organization_id = o.id
                 LEFT JOIN organizations ch ON a.current_hospital_id = ch.id
                 WHERE 1=1`;
    const params = [];

    // Support fetching ambulances belonging to a specific fleet organization
    if (filters.organizationId) {
      query += ' AND a.organization_id = ?';
      params.push(filters.organizationId);
    }

    // Support partnered ambulances: fetch ambulances that belong to fleets partnered with the given hospital
    if (filters.partneredHospitalId) {
      // Only show ambulances from fleet organizations that have active partnerships with this hospital
      query += ' AND a.organization_id IN (SELECT fleet_id FROM partnerships WHERE hospital_id = ? AND status = "active")';
      params.push(filters.partneredHospitalId);

      // Security: only show approved/available ambulances in partnered view
      if (filters.onlyApprovedForPartnered !== false) {
        query += " AND (a.status = 'available' OR a.status = 'active' OR a.status = 'onboarded' OR a.status = 'in_transit')";
      }
    }

    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }

    if (filters.currentHospitalId) {
      query += ' AND a.current_hospital_id = ?';
      params.push(filters.currentHospitalId);
    }

    query += ' ORDER BY a.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findMappedToUser(userId) {
    const [rows] = await db.query(
      `SELECT a.*, a.organization_id as organizationId, 
              o.name as organization_name, o.code as organization_code, o.type as organization_type
       FROM ambulances a
       JOIN organizations o ON a.organization_id = o.id
       JOIN ambulance_assignments aa ON a.id = aa.ambulance_id
       WHERE aa.user_id = ? AND aa.is_active = TRUE 
       AND (a.status IN ('active', 'available', 'onboarded', 'in_transit', 'on_trip'))`,
      [userId]
    );
    return rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE ambulances SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateLocation(id, lat, lng) {
    await db.query(
      `UPDATE ambulances SET current_location_lat = ?, current_location_lng = ?, last_location_update = NOW() WHERE id = ?`,
      [lat, lng, id]
    );
  }

  static async approve(id, approvedBy) {
    // When approved, mark ambulance as available for use
    const [result] = await db.query(
      `UPDATE ambulances SET status = 'available', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [approvedBy, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM ambulances WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM ambulances WHERE 1=1';
    const params = [];

    if (filters.organizationId) {
      query += ' AND organization_id = ?';
      params.push(filters.organizationId);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.partneredHospitalId) {
      query += ' AND organization_id IN (SELECT fleet_id FROM partnerships WHERE hospital_id = ? AND status = "active")';
      params.push(filters.partneredHospitalId);

      // If caller should only see approved fleet ambulances in partnered view, enforce it here.
      if (filters.onlyApprovedForPartnered !== false) {
        query += " AND (status = 'available' OR status = 'active' OR status = 'onboarded' OR status = 'in_transit')";
      }
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  static async assignUser(ambulanceId, userId, assignedBy, assigningOrganizationId = null) {
    // Use ambulance_assignments and record assigning organization
    let assigningOrgId = assigningOrganizationId;
    if (!assigningOrgId) {
      // find the assigning user's organization
      const [rows] = await db.query('SELECT organization_id FROM users WHERE id = ? LIMIT 1', [assignedBy]);
      assigningOrgId = rows.length ? rows[0].organization_id : null;
    }

    const [roleRow] = await db.query('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
    const role = roleRow[0] && roleRow[0].role ? roleRow[0].role : null;

    const [result] = await db.query(
      `INSERT INTO ambulance_assignments (ambulance_id, user_id, assigning_organization_id, assigned_by, role, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE is_active = TRUE, assigned_at = NOW(), assigned_by = VALUES(assigned_by), role = VALUES(role)`,
      [ambulanceId, userId, assigningOrgId, assignedBy, role]
    );
    return result.insertId || true;
  }

  static async unassignUser(ambulanceId, userId) {
    // Only allow deactivation if caller is from the same organization that created the assignment.
    // The controller will perform authorization; this helper simply marks the assignment inactive.
    const [result] = await db.query(
      `UPDATE ambulance_assignments SET is_active = FALSE WHERE ambulance_id = ? AND user_id = ? AND is_active = TRUE`,
      [ambulanceId, userId]
    );
    return result.affectedRows > 0;
  }

  static async getAssignedUsers(ambulanceId) {
    // Return all active assignments with minimal user details
    const [rows] = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, aa.assigning_organization_id, org.name as assigning_organization_name, aa.assigned_at, aa.role
       FROM ambulance_assignments aa
       JOIN users u ON aa.user_id = u.id
       LEFT JOIN organizations org ON aa.assigning_organization_id = org.id
       WHERE aa.ambulance_id = ? AND aa.is_active = TRUE`,
      [ambulanceId]
    );
    return rows;
  }
}

module.exports = AmbulanceModel;

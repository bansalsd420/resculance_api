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
      `SELECT a.*, o.name as organization_name, o.code as organization_code, o.type as organization_type,
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
    let query = `SELECT a.*, o.name as organization_name, o.code as organization_code, o.type as organization_type,
                        ch.name as current_hospital_name
                 FROM ambulances a
                 JOIN organizations o ON a.organization_id = o.id
                 LEFT JOIN organizations ch ON a.current_hospital_id = ch.id
                 WHERE 1=1`;
    const params = [];

    if (filters.organizationId) {
      query += ' AND a.organization_id = ?';
      params.push(filters.organizationId);
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
      `SELECT a.*, o.name as organization_name, o.code as organization_code
       FROM ambulances a
       JOIN organizations o ON a.organization_id = o.id
       JOIN ambulance_user_mappings aum ON a.id = aum.ambulance_id
       WHERE aum.user_id = ? AND aum.is_active = TRUE AND a.status = 'active'`,
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
    const [result] = await db.query(
      `UPDATE ambulances SET status = 'active', approved_by = ?, approved_at = NOW() WHERE id = ?`,
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

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  static async assignUser(ambulanceId, userId, assignedBy) {
    const [result] = await db.query(
      `INSERT INTO ambulance_user_mappings (ambulance_id, user_id, assigned_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_active = TRUE, assigned_at = NOW()`,
      [ambulanceId, userId, assignedBy]
    );
    return result.insertId || result.affectedRows > 0;
  }

  static async unassignUser(ambulanceId, userId) {
    const [result] = await db.query(
      `UPDATE ambulance_user_mappings SET is_active = FALSE WHERE ambulance_id = ? AND user_id = ?`,
      [ambulanceId, userId]
    );
    return result.affectedRows > 0;
  }

  static async getAssignedUsers(ambulanceId) {
    const [rows] = await db.query(
      `SELECT u.*, aum.assigned_at
       FROM users u
       JOIN ambulance_user_mappings aum ON u.id = aum.user_id
       WHERE aum.ambulance_id = ? AND aum.is_active = TRUE`,
      [ambulanceId]
    );
    return rows;
  }
}

module.exports = AmbulanceModel;

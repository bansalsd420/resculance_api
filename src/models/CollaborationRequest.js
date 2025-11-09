const db = require('../config/database');

class CollaborationRequestModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO collaboration_requests (hospital_id, fleet_id, request_type, message, terms, requested_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.hospitalId,
        data.fleetId,
        data.requestType || 'partnership',
        data.message,
        data.terms,
        data.requestedBy,
        data.status || 'pending'
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT cr.*, 
              h.name as hospital_name, h.code as hospital_code, h.city as hospital_city, h.state as hospital_state,
              f.name as fleet_name, f.code as fleet_code, f.city as fleet_city, f.state as fleet_state,
              u.first_name as requester_first_name, u.last_name as requester_last_name,
              approver.first_name as approver_first_name, approver.last_name as approver_last_name
       FROM collaboration_requests cr
       JOIN organizations h ON cr.hospital_id = h.id
       JOIN organizations f ON cr.fleet_id = f.id
       JOIN users u ON cr.requested_by = u.id
       LEFT JOIN users approver ON cr.approved_by = approver.id
       WHERE cr.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT cr.*, 
                        h.name as hospital_name, h.code as hospital_code, h.city as hospital_city, h.state as hospital_state,
                        f.name as fleet_name, f.code as fleet_code, f.city as fleet_city, f.state as fleet_state
                 FROM collaboration_requests cr
                 JOIN organizations h ON cr.hospital_id = h.id
                 JOIN organizations f ON cr.fleet_id = f.id
                 WHERE 1=1`;
    const params = [];

    if (filters.hospitalId) {
      query += ' AND cr.hospital_id = ?';
      params.push(filters.hospitalId);
    }

    if (filters.fleetId) {
      query += ' AND cr.fleet_id = ?';
      params.push(filters.fleetId);
    }

    if (filters.status) {
      query += ' AND cr.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY cr.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    } else {
      query += ' LIMIT 50';
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async accept(id, approvedBy, rejectedReason = null) {
    const [result] = await db.query(
      `UPDATE collaboration_requests 
       SET status = 'approved', approved_by = ?, approved_at = NOW(), rejected_reason = ?
       WHERE id = ?`,
      [approvedBy, rejectedReason, id]
    );
    return result.affectedRows > 0;
  }

  static async reject(id, approvedBy, rejectedReason) {
    const [result] = await db.query(
      `UPDATE collaboration_requests 
       SET status = 'rejected', approved_by = ?, approved_at = NOW(), rejected_reason = ?
       WHERE id = ?`,
      [approvedBy, rejectedReason, id]
    );
    return result.affectedRows > 0;
  }

  static async cancel(id) {
    const [result] = await db.query(
      `UPDATE collaboration_requests SET status = 'cancelled' WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM collaboration_requests WHERE 1=1';
    const params = [];

    if (filters.hospitalId) {
      query += ' AND hospital_id = ?';
      params.push(filters.hospitalId);
    }

    if (filters.fleetId) {
      query += ' AND fleet_id = ?';
      params.push(filters.fleetId);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = CollaborationRequestModel;

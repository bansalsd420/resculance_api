const db = require('../config/database');

class CollaborationRequestModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO collaboration_requests (hospital_id, fleet_owner_id, ambulance_id, requested_by, request_message, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.hospitalId,
        data.fleetOwnerId,
        data.ambulanceId,
        data.requestedBy,
        data.requestMessage,
        data.status || 'pending'
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT cr.*, h.name as hospital_name, h.code as hospital_code,
              f.name as fleet_owner_name, f.code as fleet_owner_code,
              a.ambulance_code, a.registration_number,
              u.first_name as requester_first_name, u.last_name as requester_last_name
       FROM collaboration_requests cr
       JOIN organizations h ON cr.hospital_id = h.id
       JOIN organizations f ON cr.fleet_owner_id = f.id
       JOIN ambulances a ON cr.ambulance_id = a.id
       JOIN users u ON cr.requested_by = u.id
       WHERE cr.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT cr.*, h.name as hospital_name, h.code as hospital_code,
                        f.name as fleet_owner_name, f.code as fleet_owner_code,
                        a.ambulance_code
                 FROM collaboration_requests cr
                 JOIN organizations h ON cr.hospital_id = h.id
                 JOIN organizations f ON cr.fleet_owner_id = f.id
                 JOIN ambulances a ON cr.ambulance_id = a.id
                 WHERE 1=1`;
    const params = [];

    if (filters.hospitalId) {
      query += ' AND cr.hospital_id = ?';
      params.push(filters.hospitalId);
    }

    if (filters.fleetOwnerId) {
      query += ' AND cr.fleet_owner_id = ?';
      params.push(filters.fleetOwnerId);
    }

    if (filters.status) {
      query += ' AND cr.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY cr.created_at DESC';

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

  static async accept(id, respondedBy, responseMessage) {
    const [result] = await db.query(
      `UPDATE collaboration_requests SET status = 'accepted', responded_by = ?, responded_at = NOW(), response_message = ?
       WHERE id = ?`,
      [respondedBy, responseMessage, id]
    );
    return result.affectedRows > 0;
  }

  static async reject(id, respondedBy, responseMessage) {
    const [result] = await db.query(
      `UPDATE collaboration_requests SET status = 'rejected', responded_by = ?, responded_at = NOW(), response_message = ?
       WHERE id = ?`,
      [respondedBy, responseMessage, id]
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

    if (filters.fleetOwnerId) {
      query += ' AND fleet_owner_id = ?';
      params.push(filters.fleetOwnerId);
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

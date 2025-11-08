const db = require('../config/database');

class PartnershipModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO partnerships (fleet_id, hospital_id, status, created_by) VALUES (?, ?, ?, ?)`,
      [data.fleetId, data.hospitalId, data.status || 'active', data.createdBy]
    );
    return result.insertId;
  }

  static async findByFleetAndHospital(fleetId, hospitalId) {
    const [rows] = await db.query(
      `SELECT * FROM partnerships WHERE fleet_id = ? AND hospital_id = ? LIMIT 1`,
      [fleetId, hospitalId]
    );
    return rows[0];
  }

  static async findActiveByHospital(hospitalId) {
    const [rows] = await db.query(
      `SELECT * FROM partnerships WHERE hospital_id = ? AND status = 'active'`,
      [hospitalId]
    );
    return rows;
  }

  static async findActiveByFleet(fleetId) {
    const [rows] = await db.query(
      `SELECT * FROM partnerships WHERE fleet_id = ? AND status = 'active'`,
      [fleetId]
    );
    return rows;
  }

  static async ensureActive(fleetId, hospitalId, createdBy) {
    const existing = await this.findByFleetAndHospital(fleetId, hospitalId);
    if (existing) {
      if (existing.status !== 'active') {
        await db.query(`UPDATE partnerships SET status = 'active' WHERE id = ?`, [existing.id]);
        try {
          // Audit log the activation
          await db.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at) VALUES (?, 'activate_partnership', 'partnership', ?, ?, ?, NOW())`,
            [createdBy || null, existing.id, JSON.stringify({ status: existing.status }), JSON.stringify({ status: 'active' })]
          );
        } catch (e) {
          console.error('Failed to write audit log for partnership activation:', e);
        }
      }
      return existing.id;
    }
    const insertId = await this.create({ fleetId, hospitalId, createdBy });
    try {
      // Audit log the creation
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, 'create_partnership', 'partnership', ?, ?, NOW())`,
        [createdBy || null, insertId, JSON.stringify({ fleetId, hospitalId, status: 'active' })]
      );
    } catch (e) {
      console.error('Failed to write audit log for partnership creation:', e);
    }
    return insertId;
  }
}

module.exports = PartnershipModel;

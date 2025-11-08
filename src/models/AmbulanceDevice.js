const db = require('../config/database');

class AmbulanceDeviceModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO ambulance_devices (ambulance_id, device_name, device_type, device_id, device_username, device_password, device_api, manufacturer, model, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.ambulanceId,
        data.deviceName,
        data.deviceType,
        data.deviceId,
        data.deviceUsername || null,
        data.devicePassword,
        data.deviceApi,
        data.manufacturer || null,
        data.model || null,
        data.status || 'active'
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM ambulance_devices WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByAmbulance(ambulanceId) {
    const [rows] = await db.query(
      `SELECT * FROM ambulance_devices WHERE ambulance_id = ? ORDER BY created_at DESC`,
      [ambulanceId]
    );
    return rows;
  }

  static async findByDeviceId(deviceId) {
    const [rows] = await db.query(
      `SELECT * FROM ambulance_devices WHERE device_id = ?`,
      [deviceId]
    );
    return rows[0];
  }

  // Find device by device_id scoped to a particular ambulance (if ambulanceId provided)
  static async findByDeviceIdForAmbulance(deviceId, ambulanceId) {
    if (!ambulanceId) return this.findByDeviceId(deviceId);
    const [rows] = await db.query(
      `SELECT * FROM ambulance_devices WHERE device_id = ? AND ambulance_id = ?`,
      [deviceId, ambulanceId]
    );
    return rows[0];
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
      `UPDATE ambulance_devices SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM ambulance_devices WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async deleteByAmbulance(ambulanceId) {
    const [result] = await db.query('DELETE FROM ambulance_devices WHERE ambulance_id = ?', [ambulanceId]);
    return result.affectedRows > 0;
  }

  static async count(ambulanceId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as total FROM ambulance_devices WHERE ambulance_id = ?',
      [ambulanceId]
    );
    return rows[0].total;
  }

  static async updateLastSync(id) {
    await db.query(
      'UPDATE ambulance_devices SET last_sync = NOW() WHERE id = ?',
      [id]
    );
  }

  static async updateSession(id, jsession) {
    await db.query(
      'UPDATE ambulance_devices SET jsession = ?, last_sync = NOW() WHERE id = ?',
      [jsession, id]
    );
  }
}

module.exports = AmbulanceDeviceModel;

const db = require('../config/database');

class VitalSignModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO vital_signs (session_id, device_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic,
                                 oxygen_saturation, temperature, respiratory_rate, glucose_level, ecg_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sessionId,
        data.deviceId,
        data.heartRate,
        data.bloodPressureSystolic,
        data.bloodPressureDiastolic,
        data.oxygenSaturation,
        data.temperature,
        data.respiratoryRate,
        data.glucoseLevel,
        data.ecgData
      ]
    );
    return result.insertId;
  }

  static async findBySession(sessionId, limit = 50) {
    const [rows] = await db.query(
      `SELECT vs.*, sd.device_name, sd.device_type
       FROM vital_signs vs
       LEFT JOIN smart_devices sd ON vs.device_id = sd.id
       WHERE vs.session_id = ?
       ORDER BY vs.recorded_at DESC
       LIMIT ?`,
      [sessionId, limit]
    );
    return rows;
  }

  static async findLatestBySession(sessionId) {
    const [rows] = await db.query(
      `SELECT vs.*, sd.device_name, sd.device_type
       FROM vital_signs vs
       LEFT JOIN smart_devices sd ON vs.device_id = sd.id
       WHERE vs.session_id = ?
       ORDER BY vs.recorded_at DESC
       LIMIT 1`,
      [sessionId]
    );
    return rows[0];
  }

  static async deleteBySession(sessionId) {
    const [result] = await db.query('DELETE FROM vital_signs WHERE session_id = ?', [sessionId]);
    return result.affectedRows > 0;
  }
}

module.exports = VitalSignModel;

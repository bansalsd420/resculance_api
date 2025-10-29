const db = require('../config/database');

class PatientSessionModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO patient_sessions (session_code, patient_id, ambulance_id, hospital_id, fleet_owner_id,
                                      assigned_doctor_id, assigned_paramedic_id, pickup_location, pickup_lat, pickup_lng,
                                      destination_location, destination_lat, destination_lng, chief_complaint, 
                                      initial_assessment, onboarded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sessionCode,
        data.patientId,
        data.ambulanceId,
        data.hospitalId,
        data.fleetOwnerId,
        data.assignedDoctorId,
        data.assignedParamedicId,
        data.pickupLocation,
        data.pickupLat,
        data.pickupLng,
        data.destinationLocation,
        data.destinationLat,
        data.destinationLng,
        data.chiefComplaint,
        data.initialAssessment,
        data.onboardedBy,
        data.status || 'onboarded'
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT ps.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
              p.age, p.gender, p.blood_group, p.medical_history, p.allergies, p.current_medications,
              a.ambulance_code, a.registration_number,
              h.name as hospital_name,
              d.first_name as doctor_first_name, d.last_name as doctor_last_name,
              pm.first_name as paramedic_first_name, pm.last_name as paramedic_last_name
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations h ON ps.hospital_id = h.id
       LEFT JOIN users d ON ps.assigned_doctor_id = d.id
       LEFT JOIN users pm ON ps.assigned_paramedic_id = pm.id
       WHERE ps.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await db.query(
      `SELECT ps.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
              a.ambulance_code, h.name as hospital_name
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations h ON ps.hospital_id = h.id
       WHERE ps.session_code = ?`,
      [code]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT ps.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
                        a.ambulance_code, h.name as hospital_name
                 FROM patient_sessions ps
                 JOIN patients p ON ps.patient_id = p.id
                 JOIN ambulances a ON ps.ambulance_id = a.id
                 JOIN organizations h ON ps.hospital_id = h.id
                 WHERE 1=1`;
    const params = [];

    if (filters.hospitalId) {
      query += ' AND ps.hospital_id = ?';
      params.push(filters.hospitalId);
    }

    if (filters.ambulanceId) {
      query += ' AND ps.ambulance_id = ?';
      params.push(filters.ambulanceId);
    }

    if (filters.status) {
      query += ' AND ps.status = ?';
      params.push(filters.status);
    }

    if (filters.assignedDoctorId) {
      query += ' AND ps.assigned_doctor_id = ?';
      params.push(filters.assignedDoctorId);
    }

    if (filters.assignedParamedicId) {
      query += ' AND ps.assigned_paramedic_id = ?';
      params.push(filters.assignedParamedicId);
    }

    query += ' ORDER BY ps.created_at DESC';

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

  static async findActiveByAmbulance(ambulanceId) {
    const [rows] = await db.query(
      `SELECT ps.* FROM patient_sessions ps
       WHERE ps.ambulance_id = ? AND ps.status IN ('onboarded', 'in_transit')
       ORDER BY ps.onboarded_at DESC
       LIMIT 1`,
      [ambulanceId]
    );
    return rows[0];
  }

  static async findActiveByPatient(patientId) {
    const [rows] = await db.query(
      `SELECT ps.* FROM patient_sessions ps
       WHERE ps.patient_id = ? AND ps.status IN ('onboarded', 'in_transit')
       ORDER BY ps.onboarded_at DESC
       LIMIT 1`,
      [patientId]
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
      `UPDATE patient_sessions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async offboard(id, offboardedBy, treatmentNotes) {
    const [result] = await db.query(
      `UPDATE patient_sessions SET status = 'offboarded', offboarded_by = ?, offboarded_at = NOW(), treatment_notes = ?
       WHERE id = ?`,
      [offboardedBy, treatmentNotes, id]
    );
    return result.affectedRows > 0;
  }

  static async cancel(id) {
    const [result] = await db.query(
      `UPDATE patient_sessions SET status = 'cancelled' WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM patient_sessions WHERE 1=1';
    const params = [];

    if (filters.hospitalId) {
      query += ' AND hospital_id = ?';
      params.push(filters.hospitalId);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = PatientSessionModel;

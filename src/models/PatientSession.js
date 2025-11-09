const db = require('../config/database');

class PatientSessionModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO patient_sessions (session_code, patient_id, ambulance_id, organization_id,
                                      pickup_location, pickup_latitude, pickup_longitude,
                                      destination_hospital_id, destination_location, destination_latitude, destination_longitude,
                                      chief_complaint, initial_assessment, onboarded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sessionCode,
        data.patientId,
        data.ambulanceId,
        data.organizationId || data.hospitalId, // Support both field names for compatibility
        data.pickupLocation,
        data.pickupLat || data.pickupLatitude,
        data.pickupLng || data.pickupLongitude,
        data.destinationHospitalId,
        data.destinationLocation,
        data.destinationLat || data.destinationLatitude,
        data.destinationLng || data.destinationLongitude,
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
      `SELECT ps.*, 
              p.first_name as patient_first_name, p.last_name as patient_last_name,
              p.age, p.gender, p.blood_group, p.medical_history, p.allergies, p.current_medications,
              a.ambulance_code, a.registration_number,
              org.name as organization_name, org.type as organization_type,
              dest_org.name as destination_hospital_name
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations org ON ps.organization_id = org.id
       LEFT JOIN organizations dest_org ON ps.destination_hospital_id = dest_org.id
       WHERE ps.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await db.query(
      `SELECT ps.*, 
              p.first_name as patient_first_name, p.last_name as patient_last_name,
              a.ambulance_code, 
              org.name as organization_name, org.type as organization_type
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations org ON ps.organization_id = org.id
       WHERE ps.session_code = ?`,
      [code]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT ps.*, 
                        p.first_name as patient_first_name, p.last_name as patient_last_name,
                        a.ambulance_code, a.registration_number,
                        org.name as organization_name, org.code as organization_code, org.type as organization_type,
                        dest_org.name as destination_hospital_name
                 FROM patient_sessions ps
                 JOIN patients p ON ps.patient_id = p.id
                 JOIN ambulances a ON ps.ambulance_id = a.id
                 JOIN organizations org ON ps.organization_id = org.id
                 LEFT JOIN organizations dest_org ON ps.destination_hospital_id = dest_org.id
                 WHERE 1=1`;
    const params = [];

    if (filters.hospitalId || filters.organizationId) {
      // If caller requests allowDestination, include sessions where the destination hospital
      // equals the provided organizationId (useful for hospital users who should see inbound trips).
      if (filters.allowDestination) {
        query += ' AND (ps.organization_id = ? OR ps.destination_hospital_id = ?)';
        params.push(filters.hospitalId || filters.organizationId);
        params.push(filters.hospitalId || filters.organizationId);
      } else {
        query += ' AND ps.organization_id = ?';
        params.push(filters.hospitalId || filters.organizationId);
      }
    }

    if (filters.ambulanceId) {
      query += ' AND ps.ambulance_id = ?';
      params.push(filters.ambulanceId);
    }

    if (filters.status) {
      query += ' AND ps.status = ?';
      params.push(filters.status);
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
       WHERE ps.ambulance_id = ? AND ps.status IN ('active', 'onboarded', 'in_transit')
       ORDER BY ps.onboarded_at DESC
       LIMIT 1`,
      [ambulanceId]
    );
    return rows[0];
  }

  static async findActiveByPatient(patientId) {
    const [rows] = await db.query(
      `SELECT ps.* FROM patient_sessions ps
       WHERE ps.patient_id = ? AND ps.status IN ('active', 'onboarded', 'in_transit')
       ORDER BY ps.onboarded_at DESC
       LIMIT 1`,
      [patientId]
    );
    return rows[0];
  }

  static async findByPatient(patientId) {
    const [rows] = await db.query(
      `SELECT ps.*, 
              p.first_name as patient_first_name, p.last_name as patient_last_name,
              a.ambulance_code, a.registration_number,
              org.name as organization_name
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations org ON ps.organization_id = org.id
       WHERE ps.patient_id = ?
       ORDER BY ps.created_at DESC`,
      [patientId]
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

    if (filters.hospitalId || filters.organizationId) {
      query += ' AND organization_id = ?';
      params.push(filters.hospitalId || filters.organizationId);
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

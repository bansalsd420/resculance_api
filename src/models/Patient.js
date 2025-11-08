const db = require('../config/database');

class PatientModel {
  static async create(data) {
    // allow organizationId to be provided; if omitted insert NULL
    const [result] = await db.query(
      `INSERT INTO patients (
         organization_id, patient_code, first_name, last_name, date_of_birth, age, gender, blood_group, phone,
         emergency_contact_name, emergency_contact_phone, emergency_contact_relation, address, medical_history, allergies, current_medications, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.organizationId || null,
        data.patientCode,
        data.firstName,
        data.lastName,
        data.dateOfBirth || null,
        data.age || null,
        data.gender || null,
        data.bloodGroup || null,
        data.phone || null,
        data.emergencyContactName || null,
        data.emergencyContactPhone || null,
        data.emergencyContactRelation || null,
        data.address || null,
        data.medicalHistory || null,
        data.allergies || null,
        data.currentMedications || null,
        data.createdBy || null
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM patients WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await db.query('SELECT * FROM patients WHERE patient_code = ?', [code]);
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM patients WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR patient_code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.organizationId) {
      query += ' AND organization_id = ?';
      params.push(filters.organizationId);
    }

    query += ' ORDER BY created_at DESC';

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
      `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async hideData(id, hiddenBy) {
    const [result] = await db.query(
      `UPDATE patients SET is_data_hidden = TRUE, hidden_by = ?, hidden_at = NOW() WHERE id = ?`,
      [hiddenBy, id]
    );
    return result.affectedRows > 0;
  }

  static async unhideData(id) {
    const [result] = await db.query(
      `UPDATE patients SET is_data_hidden = FALSE, hidden_by = NULL, hidden_at = NULL WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM patients WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM patients WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR patient_code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.organizationId) {
      query += ' AND organization_id = ?';
      params.push(filters.organizationId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = PatientModel;

const db = require('../config/database');

class PatientModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO patients (patient_code, first_name, last_name, age, gender, blood_group, contact_phone, 
                             emergency_contact_name, emergency_contact_phone, address, medical_history, allergies, current_medications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.patientCode,
        data.firstName,
        data.lastName,
        data.age,
        data.gender,
        data.bloodGroup,
        data.contactPhone,
        data.emergencyContactName,
        data.emergencyContactPhone,
        data.address,
        data.medicalHistory,
        data.allergies,
        data.currentMedications
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

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = PatientModel;

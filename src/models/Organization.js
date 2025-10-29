const db = require('../config/database');

class OrganizationModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO organizations (name, code, type, address, contact_person, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.code, data.type, data.address, data.contactPerson, data.contactEmail, data.contactPhone, data.status || 'active']
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM organizations WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await db.query('SELECT * FROM organizations WHERE code = ?', [code]);
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM organizations WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
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
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM organizations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM organizations WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = OrganizationModel;

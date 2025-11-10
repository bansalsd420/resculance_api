const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
    
    const [result] = await db.query(
      `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, phone, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.organizationId,
        data.username,
        data.email,
        hashedPassword,
        data.role,
        data.firstName,
        data.lastName,
        data.phone,
        data.status || 'pending_approval',
        data.createdBy
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT u.*, o.name as organization_name, o.code as organization_code, o.type as organization_type,
       creator.role as creator_role
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN users creator ON u.created_by = creator.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT u.*, o.name as organization_name, o.code as organization_code, o.type as organization_type,
       creator.role as creator_role
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN users creator ON u.created_by = creator.id
       WHERE u.email = ?`,
      [email]
    );
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await db.query(
      `SELECT u.*, o.name as organization_name, o.code as organization_code, o.type as organization_type,
       creator.role as creator_role
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN users creator ON u.created_by = creator.id
       WHERE u.username = ?`,
      [username]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT u.*, o.name as organization_name, o.code as organization_code, o.type as organization_type,
                 creator.role as creator_role
                 FROM users u
                 JOIN organizations o ON u.organization_id = o.id
                 LEFT JOIN users creator ON u.created_by = creator.id
                 WHERE 1=1`;
    const params = [];

    if (filters.organizationId) {
      query += ' AND u.organization_id = ?';
      params.push(filters.organizationId);
    }

    if (filters.role !== undefined && filters.role !== null) {
      // support passing an array of roles for IN queries
      if (Array.isArray(filters.role)) {
        const placeholders = filters.role.map(() => '?').join(',');
        query += ` AND u.role IN (${placeholders})`;
        params.push(...filters.role);
      } else {
        query += ' AND u.role = ?';
        params.push(filters.role);
      }
    }

    if (filters.status) {
      query += ' AND u.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY u.created_at DESC';

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
      if (data[key] !== undefined && key !== 'password') {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = ?`);
        values.push(data[key]);
      }
    });

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      fields.push('password = ?');
      values.push(hashedPassword);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateLastLogin(id) {
    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];

    if (filters.organizationId) {
      query += ' AND organization_id = ?';
      params.push(filters.organizationId);
    }

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  static async findByOrganizationAndRole(organizationId, role) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE organization_id = ? AND role = ? AND status = 'active'`,
      [organizationId, role]
    );
    return rows;
  }

  static async findByRole(role) {
    const [rows] = await db.query(
      `SELECT u.*, o.name as organization_name, o.code as organization_code
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.role = ? AND u.status = 'active'`,
      [role]
    );
    return rows;
  }

  static async findAdminsByOrganization(organizationId) {
    const [rows] = await db.query(
      `SELECT * FROM users 
       WHERE organization_id = ? 
       AND role IN ('hospital_admin', 'fleet_admin') 
       AND status = 'active'`,
      [organizationId]
    );
    return rows;
  }

  static async findByAmbulanceId(ambulanceId) {
    const [rows] = await db.query(
      `SELECT u.* FROM users u
       JOIN ambulance_assignments aa ON u.id = aa.user_id
       WHERE aa.ambulance_id = ? AND u.status = 'active'`,
      [ambulanceId]
    );
    return rows;
  }
}

module.exports = UserModel;

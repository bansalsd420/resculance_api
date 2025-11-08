const db = require('../config/database');

class OrganizationModel {
  // Cache table columns to avoid querying INFORMATION_SCHEMA on every insert
  static _tableColumns = null;

  static async _ensureColumns() {
    if (this._tableColumns) return this._tableColumns;
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizations'`
    );
    this._tableColumns = rows.map(r => r.COLUMN_NAME);
    return this._tableColumns;
  }

  static async create(data) {
    // Ensure we know which columns exist in the organizations table
    const cols = await this._ensureColumns();

    // Logical field -> candidate DB column names in order of preference
    const candidates = {
      name: ['name'],
      code: ['code'],
      type: ['type'],
      address: ['address'],
      city: ['city'],
      state: ['state'],
      postal: ['postal_code', 'pincode', 'postalCode', 'postal_code', 'zip_code', 'zipCode'],
      contact_person: ['contact_person', 'contactPerson'],
      phone: ['phone', 'contact_phone', 'contactPhone'],
      email: ['email', 'contact_email', 'contactEmail'],
      status: ['status'],
      license: ['license_number', 'licenseNumber']
    };

    const insertCols = [];
    const placeholders = [];
    const values = [];

    // Helper to pick first existing column from candidates
    const pickCol = (list) => list.find(c => cols.includes(c));

    // required/basic fields
    ['name', 'code', 'type'].forEach(k => {
      const col = pickCol(candidates[k]);
      if (col) {
        insertCols.push(col);
        placeholders.push('?');
        values.push(data[k] || null);
      }
    });

    // optional fields
    // city
    const cityCol = pickCol(candidates.city);
    if (cityCol && (data.city !== undefined || data.cityName !== undefined)) {
      insertCols.push(cityCol);
      placeholders.push('?');
      values.push(data.city || data.cityName || null);
    }

    // state
    const stateCol = pickCol(candidates.state);
    if (stateCol && data.state !== undefined) {
      insertCols.push(stateCol);
      placeholders.push('?');
      values.push(data.state || null);
    }

    // postal/pincode
    const postalCol = pickCol(candidates.postal);
    if (postalCol && (data.postalCode !== undefined || data.zipCode !== undefined || data.pincode !== undefined)) {
      insertCols.push(postalCol);
      placeholders.push('?');
      values.push(data.postalCode || data.zipCode || data.pincode || null);
    }

    // contact person
    const cpCol = pickCol(candidates.contact_person);
    if (cpCol && data.contactPerson !== undefined) {
      insertCols.push(cpCol);
      placeholders.push('?');
      values.push(data.contactPerson || null);
    }

    // phone
    const phoneCol = pickCol(candidates.phone);
    if (phoneCol && (data.phone !== undefined || data.contactPhone !== undefined || data.contact_phone !== undefined)) {
      insertCols.push(phoneCol);
      placeholders.push('?');
      values.push(data.phone || data.contactPhone || data.contact_phone || null);
    }

    // email
    const emailCol = pickCol(candidates.email);
    if (emailCol && (data.email !== undefined || data.contactEmail !== undefined || data.contact_email !== undefined)) {
      insertCols.push(emailCol);
      placeholders.push('?');
      values.push(data.email || data.contactEmail || data.contact_email || null);
    }

    // license
    const licCol = pickCol(candidates.license);
    if (licCol && (data.licenseNumber !== undefined || data.license_number !== undefined)) {
      insertCols.push(licCol);
      placeholders.push('?');
      values.push(data.licenseNumber || data.license_number || null);
    }

    // address/status fallbacks
    const addrCol = pickCol(candidates.address);
    if (addrCol && data.address !== undefined && !insertCols.includes(addrCol)) {
      insertCols.push(addrCol);
      placeholders.push('?');
      values.push(data.address || null);
    }

    const statusCol = pickCol(candidates.status);
    if (statusCol && data.status !== undefined && !insertCols.includes(statusCol)) {
      insertCols.push(statusCol);
      placeholders.push('?');
      values.push(data.status || 'active');
    }

    if (insertCols.length === 0) {
      throw new Error('No valid columns available to insert into organizations');
    }

    const sql = `INSERT INTO organizations (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`;
    // Debug: log SQL and values when running in development so we can troubleshoot mapping issues
    if (process.env.NODE_ENV !== 'production') {
      console.log('Organization INSERT SQL:', sql);
      console.log('Organization INSERT VALUES:', values);
    }
    const [result] = await db.query(sql, values);
    return result.insertId;
  }

  static async update(id, data) {
    // Map logical fields to actual DB columns similarly to create
    const cols = await this._ensureColumns();
    const candidates = {
      city: ['city'],
      state: ['state'],
      postal: ['postal_code', 'pincode', 'postalCode', 'zip_code', 'zipCode'],
      contact_person: ['contact_person', 'contactPerson'],
      phone: ['phone', 'contact_phone', 'contactPhone'],
      email: ['email', 'contact_email', 'contactEmail'],
      license: ['license_number', 'licenseNumber'],
      address: ['address'],
      status: ['status'],
      name: ['name']
    };
    const pickCol = (list) => list.find(c => cols.includes(c));

    const fields = [];
    const values = [];

    // For each logical key, if data provides it, map to actual column
    if (data.name !== undefined) {
      const c = pickCol(candidates.name);
      if (c) { fields.push(`${c} = ?`); values.push(data.name); }
    }
    if (data.address !== undefined) {
      const c = pickCol(candidates.address);
      if (c) { fields.push(`${c} = ?`); values.push(data.address); }
    }
    if (data.city !== undefined) {
      const c = pickCol(candidates.city);
      if (c) { fields.push(`${c} = ?`); values.push(data.city); }
    }
    if (data.state !== undefined) {
      const c = pickCol(candidates.state);
      if (c) { fields.push(`${c} = ?`); values.push(data.state); }
    }
    if (data.postal_code !== undefined || data.postalCode !== undefined || data.zipCode !== undefined || data.zip_code !== undefined || data.pincode !== undefined) {
      const val = data.postal_code || data.postalCode || data.zipCode || data.zip_code || data.pincode || null;
      const c = pickCol(candidates.postal);
      if (c) { fields.push(`${c} = ?`); values.push(val); }
    }
    if (data.contact_person !== undefined || data.contactPerson !== undefined) {
      const val = data.contact_person || data.contactPerson || null;
      const c = pickCol(candidates.contact_person);
      if (c) { fields.push(`${c} = ?`); values.push(val); }
    }
    if (data.phone !== undefined || data.contactPhone !== undefined || data.contact_phone !== undefined) {
      const val = data.phone || data.contactPhone || data.contact_phone || null;
      const c = pickCol(candidates.phone);
      if (c) { fields.push(`${c} = ?`); values.push(val); }
    }
    if (data.email !== undefined || data.contactEmail !== undefined || data.contact_email !== undefined) {
      const val = data.email || data.contactEmail || data.contact_email || null;
      const c = pickCol(candidates.email);
      if (c) { fields.push(`${c} = ?`); values.push(val); }
    }
    if (data.license_number !== undefined || data.licenseNumber !== undefined) {
      const val = data.license_number || data.licenseNumber || null;
      const c = pickCol(candidates.license);
      if (c) { fields.push(`${c} = ?`); values.push(val); }
    }
    if (data.status !== undefined) {
      const c = pickCol(candidates.status);
      if (c) { fields.push(`${c} = ?`); values.push(data.status); }
    }
    if (data.is_active !== undefined) {
      const c = cols.includes('is_active') ? 'is_active' : null;
      if (c) { fields.push(`${c} = ?`); values.push(data.is_active ? 1 : 0); }
    }

    if (fields.length === 0) return false;
    values.push(id);
    const [result] = await db.query(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.affectedRows > 0;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM organizations WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await db.query('SELECT * FROM organizations WHERE code = ?', [code]);
    return rows[0];
  }

  static async findByEmail(email) {
    if (!email) return null;
    const cols = await this._ensureColumns();
    const candidates = ['email', 'contact_email'];
    const present = candidates.filter(c => cols.includes(c));
    if (present.length === 0) return null;

    // Build WHERE clause only for present columns
    const where = present.map(c => `${c} = ?`).join(' OR ');
    const params = present.map(() => email);
    const sql = `SELECT * FROM organizations WHERE ${where} LIMIT 1`;
    const [rows] = await db.query(sql, params);
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

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active === 'true' || filters.is_active === true || filters.is_active === 1 ? 1 : 0);
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

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active === 'true' || filters.is_active === true || filters.is_active === 1 ? 1 : 0);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = OrganizationModel;

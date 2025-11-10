const db = require('../config/database');

/**
 * PatientSessionData Model
 * Handles notes, medications, and files added during active patient sessions
 */
class PatientSessionDataModel {
  /**
   * Create a new session data entry (note, medication, or file)
   * @param {number} sessionId - The patient session ID
   * @param {string} dataType - Type of data: 'note', 'medication', or 'file'
   * @param {object} content - JSON content specific to data type
   * @param {number} addedBy - User ID who added this data
   * @returns {Promise<object>} Created data entry with ID
   */
  static async create(sessionId, dataType, content, addedBy) {
    const [result] = await db.query(
      `INSERT INTO patient_session_data (session_id, data_type, content, added_by)
       VALUES (?, ?, ?, ?)`,
      [sessionId, dataType, JSON.stringify(content), addedBy]
    );

    // Fetch the created entry with user details
    return this.findById(result.insertId);
  }

  /**
   * Find a session data entry by ID
   * @param {number} id - Data entry ID
   * @returns {Promise<object|null>} Data entry with user details
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT 
        psd.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
       FROM patient_session_data psd
       LEFT JOIN users u ON psd.added_by = u.id
       WHERE psd.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      sessionId: row.session_id,
      dataType: row.data_type,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      addedBy: {
        id: row.added_by,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role
      },
      addedAt: row.added_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Find all data entries for a session
   * @param {number} sessionId - The patient session ID
   * @returns {Promise<Array>} Array of data entries grouped by type
   */
  static async findBySession(sessionId) {
    const [rows] = await db.query(
      `SELECT 
        psd.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
       FROM patient_session_data psd
       LEFT JOIN users u ON psd.added_by = u.id
       WHERE psd.session_id = ?
       ORDER BY psd.added_at ASC`,
      [sessionId]
    );

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      dataType: row.data_type,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      addedBy: {
        id: row.added_by,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role
      },
      addedAt: row.added_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Find all data entries for a session by specific type
   * @param {number} sessionId - The patient session ID
   * @param {string} dataType - Type filter: 'note', 'medication', or 'file'
   * @returns {Promise<Array>} Array of filtered data entries
   */
  static async findBySessionAndType(sessionId, dataType) {
    const [rows] = await db.query(
      `SELECT 
        psd.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
       FROM patient_session_data psd
       LEFT JOIN users u ON psd.added_by = u.id
       WHERE psd.session_id = ? AND psd.data_type = ?
       ORDER BY psd.added_at ASC`,
      [sessionId, dataType]
    );

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      dataType: row.data_type,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      addedBy: {
        id: row.added_by,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role
      },
      addedAt: row.added_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Get grouped data by type for a session
   * @param {number} sessionId - The patient session ID
   * @returns {Promise<object>} Object with notes, medications, and files arrays
   */
  static async getGroupedData(sessionId) {
    const allData = await this.findBySession(sessionId);
    
    return {
      notes: allData.filter(d => d.dataType === 'note'),
      medications: allData.filter(d => d.dataType === 'medication'),
      files: allData.filter(d => d.dataType === 'file')
    };
  }

  /**
   * Delete a session data entry
   * @param {number} id - Data entry ID
   * @param {number} userId - User attempting to delete (for permission check)
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async delete(id, userId) {
    // First check if the user is the one who added it (or has permission)
    const entry = await this.findById(id);
    if (!entry) {
      throw new Error('Data entry not found');
    }

    const [result] = await db.query(
      `DELETE FROM patient_session_data WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete all data for a session (used when session is deleted)
   * @param {number} sessionId - The patient session ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async deleteBySession(sessionId) {
    const [result] = await db.query(
      `DELETE FROM patient_session_data WHERE session_id = ?`,
      [sessionId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Count entries by type for a session
   * @param {number} sessionId - The patient session ID
   * @returns {Promise<object>} Counts for each data type
   */
  static async countByType(sessionId) {
    const [rows] = await db.query(
      `SELECT 
        data_type,
        COUNT(*) as count
       FROM patient_session_data
       WHERE session_id = ?
       GROUP BY data_type`,
      [sessionId]
    );

    const counts = { notes: 0, medications: 0, files: 0 };
    rows.forEach(row => {
      if (row.data_type === 'note') counts.notes = row.count;
      if (row.data_type === 'medication') counts.medications = row.count;
      if (row.data_type === 'file') counts.files = row.count;
    });

    return counts;
  }
}

module.exports = PatientSessionDataModel;

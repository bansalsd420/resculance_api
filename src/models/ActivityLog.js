const db = require('../config/database');

/**
 * ActivityLog Model
 * Handles all activity logging for audit trails
 */
class ActivityLog {
  
  /**
   * Create a new activity log entry
   * @param {Object} data - Activity log data
   * @returns {Promise<number>} - Inserted activity log ID
   */
  static async create(data) {
    const {
      activity,
      comments,
      userId,
      userName,
      organizationId = null,
      organizationName = null,
      metadata = null,
      ipAddress = null,
      userAgent = null
    } = data;

    const [result] = await db.query(
      `INSERT INTO activity_logs 
       (activity, comments, user_id, user_name, organization_id, organization_name, metadata, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity,
        comments,
        userId,
        userName,
        organizationId,
        organizationName,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent
      ]
    );

    return result.insertId;
  }

  /**
   * Get all activity logs with filters and pagination
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of activity logs
   */
  static async findAll(filters = {}) {
    const {
      activity,
      userId,
      organizationId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = filters;

    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    // Apply filters
    if (activity) {
      query += ' AND activity = ?';
      params.push(activity);
    }

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (organizationId) {
      query += ' AND organization_id = ?';
      params.push(organizationId);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    if (search) {
      query += ' AND (comments LIKE ? OR user_name LIKE ? OR organization_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Order by most recent first
    query += ' ORDER BY created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Get total count of activity logs with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} - Total count
   */
  static async count(filters = {}) {
    const {
      activity,
      userId,
      organizationId,
      startDate,
      endDate,
      search
    } = filters;

    let query = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
    const params = [];

    // Apply same filters as findAll
    if (activity) {
      query += ' AND activity = ?';
      params.push(activity);
    }

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (organizationId) {
      query += ' AND organization_id = ?';
      params.push(organizationId);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    if (search) {
      query += ' AND (comments LIKE ? OR user_name LIKE ? OR organization_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  /**
   * Get activity log by ID
   * @param {number} id - Activity log ID
   * @returns {Promise<Object|null>} - Activity log object or null
   */
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM activity_logs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Delete activity logs older than specified days
   * @param {number} days - Number of days to keep
   * @returns {Promise<number>} - Number of deleted rows
   */
  static async deleteOlderThan(days) {
    const [result] = await db.query(
      'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
    return result.affectedRows;
  }

  /**
   * Get distinct activities for filtering
   * @returns {Promise<Array>} - Array of activity types
   */
  static async getDistinctActivities() {
    const [rows] = await db.query(
      'SELECT DISTINCT activity FROM activity_logs ORDER BY activity'
    );
    return rows.map(row => row.activity);
  }

  /**
   * Get distinct users for filtering
   * @returns {Promise<Array>} - Array of user objects
   */
  static async getDistinctUsers() {
    const [rows] = await db.query(
      `SELECT DISTINCT user_id, user_name 
       FROM activity_logs 
       ORDER BY user_name`
    );
    return rows;
  }
}

module.exports = ActivityLog;

const db = require('../config/database');

class NotificationModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.type,
        data.title,
        data.message,
        data.data ? JSON.stringify(data.data) : null
      ]
    );
    return result.insertId;
  }

  static async createMultiple(notifications) {
    if (!notifications || notifications.length === 0) return [];
    
    const values = notifications.map(n => [
      n.userId,
      n.type,
      n.title,
      n.message,
      n.data ? JSON.stringify(n.data) : null
    ]);

    const placeholders = notifications.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    const [result] = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ${placeholders}`,
      flatValues
    );
    return result;
  }

  static async findByUserId(userId, limit = 50) {
    const [rows] = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    
    return rows.map(row => ({
      ...row,
      data: row.data ? JSON.parse(row.data) : null
    }));
  }

  static async findUnreadByUserId(userId) {
    const [rows] = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = ? AND is_read = FALSE
       ORDER BY created_at DESC`,
      [userId]
    );
    
    return rows.map(row => ({
      ...row,
      data: row.data ? JSON.parse(row.data) : null
    }));
  }

  static async getUnreadCount(userId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    return rows[0].count;
  }

  static async markAsRead(id, userId) {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  }

  static async markAllAsRead(userId) {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
  }

  static async deleteById(id, userId) {
    await db.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  }

  static async deleteAllForUser(userId) {
    await db.query(
      `DELETE FROM notifications WHERE user_id = ?`,
      [userId]
    );
  }
}

module.exports = NotificationModel;

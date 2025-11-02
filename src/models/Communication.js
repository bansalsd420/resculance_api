const db = require('../config/database');

class CommunicationModel {
  // Create a new group chat message for a trip/session
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO communications (session_id, sender_id, message_type, message, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.sessionId,
        data.senderId,
        data.messageType || data.message_type || 'text',
        data.message,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );
    return result.insertId;
  }

  // Get all messages for a session (group chat)
  static async findBySession(sessionId, limit = 100) {
    const [rows] = await db.query(
      `SELECT c.*, 
              s.first_name as sender_first_name, 
              s.last_name as sender_last_name, 
              s.role as sender_role,
              s.email as sender_email
       FROM communications c
       JOIN users s ON c.sender_id = s.id
       WHERE c.session_id = ?
       ORDER BY c.created_at ASC
       LIMIT ?`,
      [sessionId, limit]
    );
    
    // Parse JSON fields
    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      read_by: row.read_by ? JSON.parse(row.read_by) : []
    }));
  }

  // Mark message as read by a user
  static async markAsRead(messageId, userId) {
    const [rows] = await db.query(
      'SELECT read_by FROM communications WHERE id = ?',
      [messageId]
    );
    
    if (rows.length === 0) return false;
    
    let readBy = rows[0].read_by ? JSON.parse(rows[0].read_by) : [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      const [result] = await db.query(
        'UPDATE communications SET read_by = ? WHERE id = ?',
        [JSON.stringify(readBy), messageId]
      );
      return result.affectedRows > 0;
    }
    return true;
  }

  // Get unread message count for a user in a session
  static async getUnreadCount(sessionId, userId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM communications 
       WHERE session_id = ? 
       AND sender_id != ? 
       AND (read_by IS NULL OR JSON_SEARCH(read_by, 'one', ?) IS NULL)`,
      [sessionId, userId, userId.toString()]
    );
    return rows[0].count;
  }

  static async deleteBySession(sessionId) {
    const [result] = await db.query('DELETE FROM communications WHERE session_id = ?', [sessionId]);
    return result.affectedRows > 0;
  }
}

module.exports = CommunicationModel;

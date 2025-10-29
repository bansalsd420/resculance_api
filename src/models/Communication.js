const db = require('../config/database');

class CommunicationModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO communications (session_id, sender_id, receiver_id, communication_type, message, duration)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.sessionId,
        data.senderId,
        data.receiverId,
        data.communicationType,
        data.message,
        data.duration
      ]
    );
    return result.insertId;
  }

  static async findBySession(sessionId, limit = 100) {
    const [rows] = await db.query(
      `SELECT c.*, 
              s.first_name as sender_first_name, s.last_name as sender_last_name, s.role as sender_role,
              r.first_name as receiver_first_name, r.last_name as receiver_last_name, r.role as receiver_role
       FROM communications c
       JOIN users s ON c.sender_id = s.id
       LEFT JOIN users r ON c.receiver_id = r.id
       WHERE c.session_id = ?
       ORDER BY c.created_at ASC
       LIMIT ?`,
      [sessionId, limit]
    );
    return rows;
  }

  static async deleteBySession(sessionId) {
    const [result] = await db.query('DELETE FROM communications WHERE session_id = ?', [sessionId]);
    return result.affectedRows > 0;
  }
}

module.exports = CommunicationModel;

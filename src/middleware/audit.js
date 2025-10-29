const db = require('../config/database');

const auditLog = async (userId, action, entityType, entityId, oldValues = null, newValues = null, ipAddress = null, userAgent = null) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error - audit logging should not break the application
  }
};

const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || data?.data?.id || null;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        auditLog(
          req.user?.id,
          action,
          entityType,
          entityId,
          req.originalData || null,
          data?.data || null,
          ipAddress,
          userAgent
        );
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = { auditLog, auditMiddleware };

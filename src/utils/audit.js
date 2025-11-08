const db = require('../config/database');

/**
 * Simple audit helper to insert audit log rows.
 * Usage: await audit({ userId, action, entityType, entityId, oldValues, newValues });
 */
async function audit({ userId = null, action, entityType, entityId = null, oldValues = null, newValues = null }) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, action, entityType, entityId, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null]
    );
  } catch (e) {
    // Do not throw: auditing should not block main flows. Log and continue.
    console.error('Audit helper failed to write log:', e);
  }
}

module.exports = { audit };

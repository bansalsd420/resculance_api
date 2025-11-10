const db = require('../src/config/database');

(async () => {
  try {
    const [rows] = await db.query("SELECT id, email, username, role, status, organization_id FROM users ORDER BY id DESC LIMIT 100");
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Failed to list users:', err.message || err);
    process.exit(1);
  }
})();

require('dotenv').config();
const db = require('../src/config/database');

(async () => {
  try {
    const [rows] = await db.query("SELECT id, email, role, status, organization_id, first_name, last_name FROM users WHERE email = ?", ['superadmin@resculance.com']);
    if (!rows || rows.length === 0) {
      console.log('No superadmin user found with email superadmin@resculance.com');
      process.exit(0);
    }
    console.log('Superadmin record(s):');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying users table:', err);
    process.exit(1);
  }
})();

require('dotenv').config();
const db = require('../config/database');

async function reset() {
  try {
    console.log('🔄 Resetting database...\n');

    // Drop tables in reverse order of dependencies
    const tables = [
      'audit_logs',
      'communications',
      'vital_signs',
      'patient_sessions',
      'patients',
      'collaboration_requests',
      'ambulance_user_mappings',
      'ambulance_devices',
      'smart_devices',
      'refresh_tokens',
      'ambulances',
      'users',
      'organizations'
    ];

    for (const table of tables) {
      await db.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`  ✅ Dropped table: ${table}`);
    }

    console.log('\n✅ Database reset completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  reset();
}

module.exports = { reset };

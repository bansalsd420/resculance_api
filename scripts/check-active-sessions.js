require('dotenv').config();
const db = require('../src/config/database');

async function checkActiveSessions() {
  console.log('🔍 Checking active patient sessions...\n');

  try {
    // Get all active sessions
    const [sessions] = await db.query(`
      SELECT 
        ps.id,
        ps.session_code,
        ps.status,
        ps.onboarded_at,
        ps.offboarded_at,
        p.first_name,
        p.last_name,
        a.ambulance_code,
        a.registration_number
      FROM patient_sessions ps
      JOIN patients p ON ps.patient_id = p.id
      JOIN ambulances a ON ps.ambulance_id = a.id
      WHERE ps.status IN ('active', 'onboarded', 'in_transit')
      ORDER BY ps.onboarded_at DESC
    `);

    if (sessions.length === 0) {
      console.log('✅ No active sessions found.');
      return;
    }

    console.log(`Found ${sessions.length} active session(s):\n`);
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session: ${session.session_code}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Patient: ${session.first_name} ${session.last_name}`);
      console.log(`   Ambulance: ${session.ambulance_code} (${session.registration_number})`);
      console.log(`   Onboarded: ${session.onboarded_at}`);
      console.log(`   Offboarded: ${session.offboarded_at || 'N/A'}`);
      console.log('');
    });

    // Check for any sessions that should be offboarded
    const [oldSessions] = await db.query(`
      SELECT COUNT(*) as count
      FROM patient_sessions
      WHERE status IN ('active', 'onboarded', 'in_transit')
        AND onboarded_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    if (oldSessions[0].count > 0) {
      console.log(`⚠️  Warning: ${oldSessions[0].count} session(s) are older than 24 hours and still active.`);
      console.log('   Consider offboarding them if they should be completed.\n');
    }

  } catch (error) {
    console.error('❌ Error checking sessions:', error);
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  checkActiveSessions();
}

module.exports = { checkActiveSessions };

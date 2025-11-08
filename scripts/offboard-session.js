require('dotenv').config();
const db = require('../src/config/database');

async function offboardSession(sessionId) {
  console.log(`🔄 Attempting to offboard session ID: ${sessionId}...\n`);

  try {
    // Get session details
    const [sessions] = await db.query(`
      SELECT 
        ps.id,
        ps.session_code,
        ps.status,
        ps.ambulance_id,
        p.first_name,
        p.last_name,
        a.ambulance_code
      FROM patient_sessions ps
      JOIN patients p ON ps.patient_id = p.id
      JOIN ambulances a ON ps.ambulance_id = a.id
      WHERE ps.id = ?
    `, [sessionId]);

    if (sessions.length === 0) {
      console.log('❌ Session not found.');
      return;
    }

    const session = sessions[0];
    
    console.log(`Session Details:`);
    console.log(`  Code: ${session.session_code}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Patient: ${session.first_name} ${session.last_name}`);
    console.log(`  Ambulance: ${session.ambulance_code}\n`);

    if (session.status === 'offboarded') {
      console.log('⚠️  Session is already offboarded.');
      return;
    }

    // Get admin user for offboarding
    const [adminUsers] = await db.query(`
      SELECT id FROM users WHERE role = 'superadmin' LIMIT 1
    `);

    if (adminUsers.length === 0) {
      console.log('❌ No admin user found to perform offboarding.');
      return;
    }

    const adminUserId = adminUsers[0].id;

    // Offboard the session
    await db.query(`
      UPDATE patient_sessions 
      SET status = 'offboarded', 
          offboarded_by = ?, 
          offboarded_at = NOW(),
          treatment_notes = 'Offboarded via script'
      WHERE id = ?
    `, [adminUserId, sessionId]);

    // Update ambulance status
    await db.query(`
      UPDATE ambulances 
      SET status = 'available', 
          current_hospital_id = NULL
      WHERE id = ?
    `, [session.ambulance_id]);

    console.log('✅ Session offboarded successfully!');
    console.log('✅ Ambulance status updated to available.\n');

  } catch (error) {
    console.error('❌ Error offboarding session:', error);
  } finally {
    await db.end();
  }
}

// Get session ID from command line argument
const sessionId = process.argv[2];

if (!sessionId) {
  console.log('Usage: node scripts/offboard-session.js <sessionId>');
  console.log('Example: node scripts/offboard-session.js 1');
  process.exit(1);
}

if (require.main === module) {
  offboardSession(sessionId);
}

module.exports = { offboardSession };

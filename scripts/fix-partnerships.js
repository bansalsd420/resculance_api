require('dotenv').config();
const db = require('../src/config/database');

async function fixPartnerships() {
  try {
    const [approved] = await db.query("SELECT id, fleet_id, hospital_id, approved_by, requested_by FROM collaboration_requests WHERE status = 'approved'");
    console.log(`Found ${approved.length} approved collaboration requests`);
    for (const row of approved) {
      const [existing] = await db.query('SELECT * FROM partnerships WHERE fleet_id = ? AND hospital_id = ?', [row.fleet_id, row.hospital_id]);
      if (existing.length === 0) {
        const createdBy = row.approved_by || row.requested_by || null;
        const [res] = await db.query('INSERT INTO partnerships (fleet_id, hospital_id, status, created_by) VALUES (?, ?, ?, ?)', [row.fleet_id, row.hospital_id, 'active', createdBy]);
        console.log(`Created partnership id=${res.insertId} for fleet=${row.fleet_id} hospital=${row.hospital_id}`);
      } else {
        console.log(`Partnership already exists for fleet=${row.fleet_id} hospital=${row.hospital_id}`);
      }
    }
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing partnerships:', err);
    process.exit(1);
  }
}

fixPartnerships();

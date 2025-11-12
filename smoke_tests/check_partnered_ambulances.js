require('dotenv').config();
const mysql = require('mysql2/promise');

async function run(hospitalId) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.166.202',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
  });

  console.log(`Checking hospital ID: ${hospitalId}`);

  const [hospitalAmbs] = await conn.query('SELECT id, registration_number FROM ambulances WHERE organization_id = ?', [hospitalId]);
  console.log(`Hospital ambulances (${hospitalAmbs.length}):`, hospitalAmbs.map(a => `${a.id}:${a.registration_number}`));

  const [collabs] = await conn.query('SELECT fleet_id, hospital_id, status FROM collaboration_requests WHERE LOWER(status) = "approved" AND hospital_id = ?', [hospitalId]);
  const fleetIds = collabs.map(c => c.fleet_id).filter(Boolean);
  console.log('Partnered fleet IDs:', fleetIds);

  const partneredAmbs = [];
  for (const fid of fleetIds) {
    const [rows] = await conn.query('SELECT id, registration_number FROM ambulances WHERE organization_id = ?', [fid]);
    partneredAmbs.push({ fleetId: fid, ambulances: rows });
    console.log(`Fleet ${fid} ambulances (${rows.length}):`, rows.map(a => `${a.id}:${a.registration_number}`));
  }

  // Check overlaps by id and registration_number
  const hospitalIds = new Set(hospitalAmbs.map(a => String(a.id)));
  const hospitalRegs = new Set(hospitalAmbs.map(a => (a.registration_number || '').toLowerCase()));

  let overlapFound = false;
  for (const group of partneredAmbs) {
    for (const a of group.ambulances) {
      if (hospitalIds.has(String(a.id)) || hospitalRegs.has((a.registration_number || '').toLowerCase())) {
        console.error('OVERLAP found with fleet', group.fleetId, 'ambulance', a);
        overlapFound = true;
      }
    }
  }

  if (!overlapFound) {
    console.log('No overlaps detected between hospital ambulances and partnered fleet ambulances.');
  }

  await conn.end();
}

const hospitalId = process.argv[2] || 15; // default to 15 (apex)
run(hospitalId).catch(err => { console.error('Smoke test failed:', err); process.exit(1); });

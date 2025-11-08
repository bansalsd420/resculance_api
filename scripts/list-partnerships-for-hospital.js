const db = require('../src/config/database');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/list-partnerships-for-hospital.js <hospitalId|hospitalName>');
  process.exit(1);
}

(async () => {
  try {
    let hospitalId = null;
    if (/^\d+$/.test(arg)) {
      hospitalId = parseInt(arg, 10);
    } else {
      // find by name (partial match)
      const [rows] = await db.query('SELECT id, name FROM organizations WHERE name LIKE ? LIMIT 5', [`%${arg}%`]);
      if (rows.length === 0) {
        console.error('No organization found matching', arg);
        process.exit(2);
      }
      if (rows.length > 1) {
        console.log('Multiple orgs matched:');
        rows.forEach(r => console.log(r.id, r.name));
        console.log('Pick an id and re-run the script.');
        process.exit(0);
      }
      hospitalId = rows[0].id;
    }

    console.log('Hospital ID:', hospitalId);

    // list active partnerships
    const [partnerships] = await db.query(
      `SELECT p.id, p.fleet_id, f.name as fleet_name, p.status
       FROM partnerships p
       JOIN organizations f ON p.fleet_id = f.id
       WHERE p.hospital_id = ? AND p.status = 'active'`,
      [hospitalId]
    );

    if (partnerships.length === 0) {
      console.log('No active partnerships found for hospital', hospitalId);
      process.exit(0);
    }

    console.log('Active partnerships:');
    for (const p of partnerships) {
      const [countRows] = await db.query('SELECT COUNT(*) AS cnt FROM ambulances WHERE organization_id = ?', [p.fleet_id]);
      console.log(`Fleet ${p.fleet_id} (${p.fleet_name}) => ambulances: ${countRows[0].cnt}`);
    }

    // Also list all ambulances visible to hospital via partnered query
    const [ambulances] = await db.query(
      `SELECT a.id, a.registration_number, a.status, o.id as fleet_id, o.name as fleet_name
       FROM ambulances a
       JOIN organizations o ON a.organization_id = o.id
       WHERE a.organization_id IN (SELECT fleet_id FROM partnerships WHERE hospital_id = ? AND status = 'active')
       ORDER BY a.created_at DESC`,
      [hospitalId]
    );

    console.log('\nAmbulances visible to hospital via partnerships:');
    ambulances.forEach(a => console.log(a.id, a.registration_number, a.status, 'fleet:', a.fleet_id, a.fleet_name));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(3);
  }
})();

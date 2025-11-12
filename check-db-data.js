const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '193.203.166.202',
    port: 3306,
    user: 'u516792586_resculance',
    password: 'Paridhi@1992',
    database: 'u516792586_resculance'
  });

  const [orgs] = await conn.query('SELECT id, name, type FROM organizations ORDER BY type, name');
  console.log('\n=== ORGANIZATIONS ===');
  orgs.forEach(o => console.log(`ID: ${o.id}, Name: ${o.name}, Type: ${o.type}`));

  const [ambs] = await conn.query('SELECT id, registration_number, organization_id, status FROM ambulances ORDER BY organization_id');
  console.log('\n=== AMBULANCES ===');
  ambs.forEach(a => console.log(`ID: ${a.id}, Reg: ${a.registration_number}, OrgID: ${a.organization_id}, Status: ${a.status}`));

  const [collabs] = await conn.query('SELECT id, hospital_id, fleet_id, status FROM collaboration_requests');
  console.log('\n=== PARTNERSHIPS ===');
  collabs.forEach(c => console.log(`ID: ${c.id}, Hospital: ${c.hospital_id}, Fleet: ${c.fleet_id}, Status: ${c.status}`));

  const [cols] = await conn.query('SHOW COLUMNS FROM patients');
  console.log('\n=== PATIENTS TABLE COLUMNS ===');
  cols.forEach(c => console.log(c.Field));

  const [patients] = await conn.query('SELECT id, first_name, last_name, organization_id FROM patients LIMIT 15');
  console.log('\n=== PATIENTS (first 15) ===');
  patients.forEach(p => console.log(`ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, OrgID: ${p.organization_id}`));

  await conn.end();
})().catch(console.error);

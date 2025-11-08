#!/usr/bin/env node
require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  const ambulanceId = process.argv[2];
  
  if (!ambulanceId) {
    console.log('Usage: node scripts/check-ambulance-partnership.js <ambulanceId>');
    console.log('Example: node scripts/check-ambulance-partnership.js 12');
    process.exit(1);
  }
  
  try {
    // Get ambulance details
    const [ambulances] = await db.query(`
      SELECT a.*, o.name as fleet_name, o.type as fleet_type 
      FROM ambulances a
      JOIN organizations o ON a.organization_id = o.id
      WHERE a.id = ?
    `, [ambulanceId]);
    
    if (ambulances.length === 0) {
      console.error(`Ambulance with ID ${ambulanceId} not found`);
      process.exit(1);
    }
    
    const ambulance = ambulances[0];
    console.log('\n📋 Ambulance Details:');
    console.log(`  ID: ${ambulance.id}`);
    console.log(`  Registration: ${ambulance.registration_number}`);
    console.log(`  Fleet Owner: ${ambulance.fleet_name} (ID: ${ambulance.organization_id})`);
    console.log(`  Fleet Type: ${ambulance.fleet_type}`);
    console.log(`  Status: ${ambulance.status}`);
    console.log(`  Current Hospital ID: ${ambulance.current_hospital_id || 'None'}`);
    
    // Get all partnerships for this fleet
    const [partnerships] = await db.query(`
      SELECT p.*, h.name as hospital_name, h.type as hospital_type
      FROM partnerships p
      JOIN organizations h ON p.hospital_id = h.id
      WHERE p.fleet_id = ? AND p.status = 'active'
    `, [ambulance.organization_id]);
    
    console.log(`\n🤝 Active Partnerships (${partnerships.length}):`);
    if (partnerships.length === 0) {
      console.log('  ⚠️  No active partnerships found for this fleet');
    } else {
      partnerships.forEach(p => {
        console.log(`  - ${p.hospital_name} (Hospital ID: ${p.hospital_id})`);
      });
    }
    
    // Get all collaboration requests
    const [requests] = await db.query(`
      SELECT cr.*, h.name as hospital_name
      FROM collaboration_requests cr
      JOIN organizations h ON cr.hospital_id = h.id
      WHERE cr.fleet_id = ?
      ORDER BY cr.created_at DESC
    `, [ambulance.organization_id]);
    
    console.log(`\n📝 Collaboration Requests (${requests.length}):`);
    requests.forEach(r => {
      console.log(`  - ${r.hospital_name} (Hospital ID: ${r.hospital_id}): ${r.status}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();

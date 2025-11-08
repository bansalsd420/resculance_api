#!/usr/bin/env node
require('dotenv').config();
const db = require('../src/config/database');
const AmbulanceModel = require('../src/models/Ambulance');

async function main() {
  const hospitalId = process.argv[2];
  if (!hospitalId) {
    console.log('Usage: node scripts/test-partnered-visibility.js <hospitalId>');
    process.exit(1);
  }

  try {
    console.log('Partnered ambulances visible to hospital (default restriction):');
    const ambulances = await AmbulanceModel.findAll({ partneredHospitalId: hospitalId });
    ambulances.forEach(a => console.log(`  - ID:${a.id} reg:${a.registration_number} org:${a.organization_id} status:${a.status}`));

    console.log('\nPartnered ambulances with override (include unapproved):');
    const ambAll = await AmbulanceModel.findAll({ partneredHospitalId: hospitalId, onlyApprovedForPartnered: false });
    ambAll.forEach(a => console.log(`  - ID:${a.id} reg:${a.registration_number} org:${a.organization_id} status:${a.status}`));

    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

main();

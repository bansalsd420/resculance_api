#!/usr/bin/env node
require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  const orgId = process.argv[2];
  const newType = process.argv[3] || 'superadmin';
  
  if (!orgId) {
    console.log('Usage: node scripts/update-org-type.js <orgId> [type]');
    console.log('Example: node scripts/update-org-type.js 8 superadmin');
    process.exit(1);
  }
  
  try {
    const [orgs] = await db.query('SELECT * FROM organizations WHERE id = ?', [orgId]);
    if (orgs.length === 0) {
      console.error(`Organization with ID ${orgId} not found`);
      process.exit(1);
    }
    
    const org = orgs[0];
    console.log(`Updating organization: ${org.name} (${org.code})`);
    console.log(`Current type: ${org.type}`);
    console.log(`New type: ${newType}`);
    
    await db.query('UPDATE organizations SET type = ? WHERE id = ?', [newType, orgId]);
    
    console.log('✅ Successfully updated organization type');
    
    const [updated] = await db.query('SELECT * FROM organizations WHERE id = ?', [orgId]);
    console.log(`Verified: ${updated[0].name} is now type "${updated[0].type}"`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();

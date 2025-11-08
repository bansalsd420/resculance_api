#!/usr/bin/env node
require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  console.log('Adding "superadmin" to organization type enum...');
  
  try {
    // Alter the enum to include 'superadmin'
    await db.query(`
      ALTER TABLE organizations 
      MODIFY COLUMN type ENUM('hospital', 'fleet_owner', 'superadmin') NOT NULL
    `);
    
    console.log('✅ Successfully updated organization type enum to include "superadmin"');
    
    // Check if there are any orgs with invalid types
    const [rows] = await db.query('SELECT id, name, type FROM organizations');
    console.log(`Found ${rows.length} organizations:`);
    rows.forEach(org => {
      console.log(`  - ${org.name} (ID: ${org.id}, Type: ${org.type})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();

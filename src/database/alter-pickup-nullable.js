require('dotenv').config();
const db = require('../config/database');

/**
 * Migration: Make pickup_location nullable
 * This allows creating patient sessions without requiring pickup location
 */
async function alterPickupLocationNullable() {
  console.log('🔧 Altering patient_sessions table: making pickup_location nullable...');

  try {
    // Alter pickup_location to be nullable
    await db.query(`
      ALTER TABLE patient_sessions 
      MODIFY COLUMN pickup_location TEXT NULL
    `);
    
    console.log('✅ Successfully altered pickup_location to nullable');
    
    // Also make chief_complaint nullable since it may not always be known at onboarding
    await db.query(`
      ALTER TABLE patient_sessions 
      MODIFY COLUMN chief_complaint TEXT NULL
    `);
    
    console.log('✅ Successfully altered chief_complaint to nullable');
    
  } catch (error) {
    console.error('❌ Error altering patient_sessions table:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  alterPickupLocationNullable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { alterPickupLocationNullable };

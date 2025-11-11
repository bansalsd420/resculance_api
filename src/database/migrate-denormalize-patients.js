require('dotenv').config();
const db = require('../config/database');

async function migrateDenormalizePatients() {
  try {
    console.log('Starting patient denormalization migration...');

    // Add is_onboarded column
    await db.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added is_onboarded column');

    // Add current_session_id column
    await db.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS current_session_id INT NULL
    `);
    console.log('✓ Added current_session_id column');

    // Add onboarded_at timestamp
    await db.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP NULL
    `);
    console.log('✓ Added onboarded_at column');

    // Add foreign key constraint
    await db.query(`
      ALTER TABLE patients 
      ADD CONSTRAINT fk_current_session 
      FOREIGN KEY (current_session_id) 
      REFERENCES patient_sessions(id) 
      ON DELETE SET NULL
    `);
    console.log('✓ Added foreign key constraint');

    // Add indexes for performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_is_onboarded 
      ON patients(is_onboarded)
    `);
    console.log('✓ Added index on is_onboarded');

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_current_session 
      ON patients(current_session_id)
    `);
    console.log('✓ Added index on current_session_id');

    // Populate existing data: mark patients with active sessions as onboarded
    await db.query(`
      UPDATE patients p
      INNER JOIN patient_sessions ps ON p.id = ps.patient_id
      SET 
        p.is_onboarded = TRUE,
        p.current_session_id = ps.id,
        p.onboarded_at = ps.created_at
      WHERE ps.status = 'active'
    `);
    console.log('✓ Populated existing data from active sessions');

    console.log('✅ Patient denormalization migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateDenormalizePatients()
    .then(() => {
      console.log('Migration complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDenormalizePatients };

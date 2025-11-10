const db = require('../config/database');

async function alterPatientsTable() {
  console.log('🔧 Altering patients table to allow nullable fields...');
  
  try {
    // Make last_name nullable
    await db.query(`
      ALTER TABLE patients 
      MODIFY COLUMN last_name VARCHAR(100) NULL
    `);
    console.log('  ✓ Made last_name nullable');

    // Make gender nullable
    await db.query(`
      ALTER TABLE patients 
      MODIFY COLUMN gender ENUM('male', 'female', 'other') NULL
    `);
    console.log('  ✓ Made gender nullable');

    // Make organization_id nullable
    await db.query(`
      ALTER TABLE patients 
      MODIFY COLUMN organization_id INT NULL
    `);
    console.log('  ✓ Made organization_id nullable');

    // Add is_active column if it doesn't exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'is_active'
    `);

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE patients 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER current_medications
      `);
      console.log('  ✓ Added is_active column');
    } else {
      console.log('  ℹ is_active column already exists');
    }

    console.log('✅ Patients table alterations completed successfully');
  } catch (error) {
    console.error('❌ Failed to alter patients table:', error.message);
    throw error;
  }
}

if (require.main === module) {
  alterPatientsTable()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { alterPatientsTable };

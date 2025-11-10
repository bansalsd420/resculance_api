require('dotenv').config();
const db = require('../config/database');

async function dropDateOfBirthColumn() {
  try {
    console.log('🔧 Checking if date_of_birth column exists...');

    const [columns] = await db.query(`SHOW COLUMNS FROM patients LIKE 'date_of_birth'`);
    
    if (columns.length > 0) {
      console.log('Dropping date_of_birth column...');
      await db.query(`ALTER TABLE patients DROP COLUMN date_of_birth`);
      console.log('✅ date_of_birth column dropped successfully');
    } else {
      console.log('✅ date_of_birth column does not exist (already removed or never existed)');
    }

    // Ensure age column exists
    const [ageCheck] = await db.query(`SHOW COLUMNS FROM patients LIKE 'age'`);
    if (ageCheck.length === 0) {
      console.log('Adding age column...');
      await db.query(`ALTER TABLE patients ADD COLUMN age INT AFTER last_name`);
      console.log('✅ age column added');
    } else {
      console.log('✅ age column already exists');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  dropDateOfBirthColumn();
}

module.exports = { dropDateOfBirthColumn };

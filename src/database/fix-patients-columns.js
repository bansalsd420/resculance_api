require('dotenv').config();
const db = require('../config/database');

async function fixPatientsTable() {
  try {
    console.log('🔧 Checking patients table columns...');

    // Check if contact_phone column exists
    const [contactPhoneCheck] = await db.query(`SHOW COLUMNS FROM patients LIKE 'contact_phone'`);
    
    if (contactPhoneCheck.length === 0) {
      console.log('Adding contact_phone column...');
      await db.query(`ALTER TABLE patients ADD COLUMN contact_phone VARCHAR(20) AFTER phone`);
      console.log('✅ Added contact_phone column');
    } else {
      console.log('✅ contact_phone column already exists');
    }

    // Check if phone column exists
    const [phoneCheck] = await db.query(`SHOW COLUMNS FROM patients LIKE 'phone'`);
    
    if (phoneCheck.length === 0) {
      console.log('Adding phone column...');
      await db.query(`ALTER TABLE patients ADD COLUMN phone VARCHAR(20) AFTER blood_group`);
      console.log('✅ Added phone column');
    } else {
      console.log('✅ phone column already exists');
    }

    // Check if emergency_contact_relation column exists
    const [relationCheck] = await db.query(`SHOW COLUMNS FROM patients LIKE 'emergency_contact_relation'`);
    
    if (relationCheck.length === 0) {
      console.log('Adding emergency_contact_relation column...');
      await db.query(`ALTER TABLE patients ADD COLUMN emergency_contact_relation VARCHAR(100) AFTER emergency_contact_phone`);
      console.log('✅ Added emergency_contact_relation column');
    } else {
      console.log('✅ emergency_contact_relation column already exists');
    }

    // Check if age column exists
    const [ageCheck] = await db.query(`SHOW COLUMNS FROM patients LIKE 'age'`);
    
    if (ageCheck.length === 0) {
      console.log('Adding age column...');
      await db.query(`ALTER TABLE patients ADD COLUMN age INT AFTER last_name`);
      console.log('✅ Added age column');
    } else {
      console.log('✅ age column already exists');
    }

    console.log('\n✅ Patients table columns fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing patients table:', error);
    process.exit(1);
  }
}

fixPatientsTable();

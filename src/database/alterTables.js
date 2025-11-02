require('dotenv').config();
const db = require('../config/database');

async function alterPatients() {
  try {
    console.log('Altering patients table...');
    
    // Add date_of_birth if not exists
    try {
      await db.query(`ALTER TABLE patients ADD COLUMN date_of_birth DATE AFTER last_name`);
      console.log('✅ Added date_of_birth column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  date_of_birth already exists');
      } else {
        throw error;
      }
    }

    // Add email if not exists
    try {
      // Check if phone column exists first
      const [phoneCheck] = await db.query(`SHOW COLUMNS FROM patients LIKE 'phone'`);
      const phoneColumn = phoneCheck.length > 0 ? 'phone' : 'last_name';
      
      await db.query(`ALTER TABLE patients ADD COLUMN email VARCHAR(255) AFTER ${phoneColumn}`);
      console.log('✅ Added email column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  email already exists');
      } else {
        console.log('⚠️  Could not add email:', error.message);
      }
    }

    // Add emergency_contact_relation if not exists
    try {
      // Check if emergency_contact_phone exists
      const [phoneCheck] = await db.query(`SHOW COLUMNS FROM patients LIKE 'emergency_contact_phone'`);
      const afterColumn = phoneCheck.length > 0 ? 'emergency_contact_phone' : 'emergency_contact';
      
      await db.query(`ALTER TABLE patients ADD COLUMN emergency_contact_relation VARCHAR(100) AFTER ${afterColumn}`);
      console.log('✅ Added emergency_contact_relation column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  emergency_contact_relation already exists');
      } else {
        console.log('⚠️  Could not add emergency_contact_relation:', error.message);
      }
    }

    // Fix patient_sessions to have onboard_time and offboard_time
    try {
      await db.query(`ALTER TABLE patient_sessions ADD COLUMN onboard_time TIMESTAMP NULL AFTER onboarded_at`);
      console.log('✅ Added onboard_time column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  onboard_time already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.query(`ALTER TABLE patient_sessions ADD COLUMN offboard_time TIMESTAMP NULL AFTER offboarded_at`);
      console.log('✅ Added offboard_time column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  offboard_time already exists');
      } else {
        throw error;
      }
    }

    // Add columns to organizations table
    try {
      await db.query(`ALTER TABLE organizations ADD COLUMN city VARCHAR(100) AFTER address`);
      console.log('✅ Added city column to organizations');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  city already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.query(`ALTER TABLE organizations ADD COLUMN state VARCHAR(50) AFTER city`);
      console.log('✅ Added state column to organizations');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  state already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.query(`ALTER TABLE organizations ADD COLUMN postal_code VARCHAR(20) AFTER state`);
      console.log('✅ Added postal_code column to organizations');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  postal_code already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.query(`ALTER TABLE organizations ADD COLUMN phone VARCHAR(20) AFTER postal_code`);
      console.log('✅ Added phone column to organizations');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  phone already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.query(`ALTER TABLE organizations ADD COLUMN email VARCHAR(255) AFTER phone`);
      console.log('✅ Added email column to organizations');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  email already exists');
      } else {
        throw error;
      }
    }

    // Add license_number and specialization to users
    try {
      await db.query(`ALTER TABLE users ADD COLUMN license_number VARCHAR(100) AFTER phone`);
      console.log('✅ Added license_number column to users');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  license_number already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.query(`ALTER TABLE users ADD COLUMN specialization VARCHAR(255) AFTER license_number`);
      console.log('✅ Added specialization column to users');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  specialization already exists');
      } else {
        throw error;
      }
    }

    // Modify collaboration_requests to make ambulance_id nullable
    try {
      await db.query(`ALTER TABLE collaboration_requests MODIFY COLUMN ambulance_id INT NULL`);
      console.log('✅ Made ambulance_id nullable in collaboration_requests');
    } catch (error) {
      console.log('⚠️  Could not modify ambulance_id:', error.message);
    }

    // Add missing columns to communications table for group chat
    console.log('\nAltering communications table...');
    
    try {
      await db.query(`ALTER TABLE communications ADD COLUMN message_type VARCHAR(50) DEFAULT 'text'`);
      console.log('✅ Added message_type column to communications');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  message_type already exists');
      } else {
        console.log('⚠️  Could not add message_type:', error.message);
      }
    }

    try {
      await db.query(`ALTER TABLE communications ADD COLUMN metadata TEXT`);
      console.log('✅ Added metadata column to communications');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  metadata already exists');
      } else {
        console.log('⚠️  Could not add metadata:', error.message);
      }
    }

    try {
      await db.query(`ALTER TABLE communications ADD COLUMN read_by JSON`);
      console.log('✅ Added read_by column to communications');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  read_by already exists');
      } else {
        console.log('⚠️  Could not add read_by:', error.message);
      }
    }

    // Migrate data from communication_type to message_type if needed
    try {
      await db.query(`UPDATE communications SET message_type = communication_type WHERE message_type IS NULL OR message_type = 'text'`);
      console.log('✅ Migrated data from communication_type to message_type');
    } catch (error) {
      console.log('⚠️  Could not migrate communication_type data:', error.message);
    }

    console.log('\n✅ All table alterations completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Alteration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  alterPatients();
}

module.exports = { alterPatients };

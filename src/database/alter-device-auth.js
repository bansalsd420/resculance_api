const db = require('../config/database');

async function alterDeviceAuthFields() {
  try {
    console.log('Adding device authentication fields to ambulance_devices table...');

    // Check if columns already exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'ambulance_devices' 
        AND COLUMN_NAME IN ('device_username', 'jsession')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    if (!existingColumns.includes('device_username')) {
      await db.query(`
        ALTER TABLE ambulance_devices 
        ADD COLUMN device_username VARCHAR(255) AFTER device_id
      `);
      console.log('✓ Added device_username column');
    } else {
      console.log('✓ device_username column already exists');
    }

    if (!existingColumns.includes('jsession')) {
      await db.query(`
        ALTER TABLE ambulance_devices 
        ADD COLUMN jsession VARCHAR(500) AFTER device_api
      `);
      console.log('✓ Added jsession column');
    } else {
      console.log('✓ jsession column already exists');
    }

    console.log('✅ Database alteration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error altering database:', error);
    process.exit(1);
  }
}

alterDeviceAuthFields();

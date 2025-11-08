require('dotenv').config();
const db = require('../config/database');

async function alterAmbulanceDeviceUnique() {
  try {
  console.log('Altering ambulance_devices unique constraint on device_id...');

  // Create a quick backup table before altering indexes
  const backupName = `ambulance_devices_backup_${Date.now()}`;
  console.log(`Creating backup table ${backupName}...`);
  await db.query(`CREATE TABLE IF NOT EXISTS \`${backupName}\` AS SELECT * FROM ambulance_devices`);
  console.log(`✓ Backup table ${backupName} created`);

    // Check existing indexes for ambulance_devices
    const [indexes] = await db.query(`
      SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ambulance_devices'
    `);

    // Find if there's a unique index on device_id
    const deviceIdIndex = indexes.find(i => i.COLUMN_NAME === 'device_id' && i.NON_UNIQUE === 0);

    if (deviceIdIndex) {
      const indexName = deviceIdIndex.INDEX_NAME;
      console.log(`Found unique index on device_id: ${indexName}, dropping it...`);
      await db.query(`ALTER TABLE ambulance_devices DROP INDEX \`${indexName}\``);
      console.log('✓ Dropped unique index on device_id');
    } else {
      console.log('✓ No unique index on device_id found (or already removed)');
    }

    // Add composite unique index on (ambulance_id, device_id) to enforce uniqueness per ambulance
    // but allow same device_id across different ambulances
    const compositeIndexName = 'unique_ambulance_device';
    // Check if composite exists
    const compositeExists = indexes.find(i => i.INDEX_NAME === compositeIndexName);
    if (!compositeExists) {
      await db.query(`ALTER TABLE ambulance_devices ADD UNIQUE KEY ${compositeIndexName} (ambulance_id, device_id)`);
      console.log(`✓ Added composite unique index ${compositeIndexName} (ambulance_id, device_id)`);
    } else {
      console.log(`✓ Composite unique index ${compositeIndexName} already exists`);
    }

    console.log('✅ Alteration complete');
    process.exit(0);
  } catch (err) {
    console.error('Failed to alter ambulance_devices indexes:', err);
    process.exit(1);
  }
}

alterAmbulanceDeviceUnique();

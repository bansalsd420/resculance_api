const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeDeviceIdConstraint() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    console.log('Connected to database');

    // Remove UNIQUE constraint on device_id
    console.log('Removing UNIQUE constraint on device_id...');
    await connection.query('ALTER TABLE ambulance_devices DROP INDEX device_id');
    
    console.log('✅ Successfully removed UNIQUE constraint on device_id');
    console.log('✅ Multiple ambulances can now share the same device_id');

  } catch (error) {
    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('✅ Constraint already removed or does not exist');
    } else {
      console.error('Error removing constraint:', error.message);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

removeDeviceIdConstraint();

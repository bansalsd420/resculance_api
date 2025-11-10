require('dotenv').config();
const pool = require('../config/database');

async function addSessionMetadataColumn() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Adding session_metadata column to patient_sessions table...');
    
    // Check if column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'patient_sessions' 
      AND COLUMN_NAME = 'session_metadata'
    `);
    
    if (columns.length > 0) {
      console.log('session_metadata column already exists');
      return;
    }
    
    // Add the JSON column for storing complete session metadata
    await connection.query(`
      ALTER TABLE patient_sessions 
      ADD COLUMN session_metadata JSON NULL COMMENT 'Complete session audit trail including crew, timeline, locations, and all changes'
    `);
    
    console.log('✅ Successfully added session_metadata column');
    
  } catch (error) {
    console.error('Error adding session_metadata column:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run if called directly
if (require.main === module) {
  addSessionMetadataColumn()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addSessionMetadataColumn;

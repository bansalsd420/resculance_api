require('dotenv').config();
const pool = require('../config/database');

async function createPatientSessionDataTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Creating patient_session_data table...');

    // Check if table already exists
    const [tables] = await connection.query(
      `SHOW TABLES LIKE 'patient_session_data'`
    );

    if (tables.length > 0) {
      console.log('⚠️  Table patient_session_data already exists, skipping creation');
      return;
    }

    // Create patient_session_data table
    await connection.query(`
      CREATE TABLE patient_session_data (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT NOT NULL,
        data_type ENUM('note', 'medication', 'file') NOT NULL,
        content JSON NOT NULL,
        added_by INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES patient_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_session_id (session_id),
        INDEX idx_data_type (data_type),
        INDEX idx_added_by (added_by),
        INDEX idx_session_type (session_id, data_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table patient_session_data created successfully');
    console.log('📋 Table structure:');
    console.log('   - id: Primary key');
    console.log('   - session_id: Foreign key to patient_sessions');
    console.log('   - data_type: ENUM(note, medication, file)');
    console.log('   - content: JSON (flexible structure for different data types)');
    console.log('   - added_by: Foreign key to users (who added this data)');
    console.log('   - added_at: Timestamp when data was added');
    console.log('   - Indexes on session_id, data_type, added_by for fast queries');
    
  } catch (error) {
    console.error('❌ Error creating patient_session_data table:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  createPatientSessionDataTable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createPatientSessionDataTable;

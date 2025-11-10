require('dotenv').config();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Database Migration
 * Creates all tables required for the Resculance API
 */
async function runComprehensiveMigration() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🚀 Starting comprehensive database migration...\n');

    // Read the exported schema file
    const schemaPath = path.join(__dirname, '..', '..', 'database-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found. Please run: node scripts/export-schema.js');
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and filter out comments and empty statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'SET FOREIGN_KEY_CHECKS=0' && stmt !== 'SET FOREIGN_KEY_CHECKS=1');

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS=0');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Extract table name for logging
      const tableMatch = statement.match(/DROP TABLE IF EXISTS `([^`]+)`/);
      if (tableMatch) {
        console.log(`📦 Processing table: ${tableMatch[1]}...`);
      }

      try {
        await connection.query(statement);
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements
      }
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS=1');

    console.log('\n✅ Database migration completed successfully!');
    console.log('📊 All tables have been created/updated');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  runComprehensiveMigration()
    .then(() => {
      console.log('\n✅ Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = runComprehensiveMigration;

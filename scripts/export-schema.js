require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function exportSchema() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    console.log('✅ Connected successfully');
    console.log('📊 Fetching table list...');

    // Get all tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       ORDER BY TABLE_NAME`,
      [process.env.DB_DATABASE]
    );

    console.log(`📋 Found ${tables.length} tables`);

    let schemaSQL = `-- Database Schema Export for ${process.env.DB_DATABASE}\n`;
    schemaSQL += `-- Generated: ${new Date().toISOString()}\n\n`;
    schemaSQL += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    // Get CREATE TABLE statement for each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`  - Exporting ${tableName}...`);

      const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      schemaSQL += `-- Table: ${tableName}\n`;
      schemaSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      schemaSQL += createTable[0]['Create Table'] + ';\n\n';
    }

    schemaSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;

    // Save to file
    const outputPath = path.join(__dirname, '..', 'database-schema.sql');
    fs.writeFileSync(outputPath, schemaSQL);

    console.log(`\n✅ Schema exported successfully to: ${outputPath}`);
    console.log(`📦 Total tables: ${tables.length}`);

  } catch (error) {
    console.error('❌ Error exporting schema:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run export
exportSchema()
  .then(() => {
    console.log('✅ Export completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Export failed:', error);
    process.exit(1);
  });

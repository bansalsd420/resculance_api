require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
  const outFile = process.argv[2] || 'd:\\Projects\\db_schema.sql';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME
  });

  console.log('Connected to DB. Exporting schema to', outFile);

  const [tables] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  // table name key differs by driver; find the correct key
  const tableKey = Object.keys(tables[0] || {}).find(k => k.toLowerCase().includes('tables_in'));
  const tableNames = tables.map(t => t[tableKey]);

  let output = `-- Database schema export for ${process.env.DB_DATABASE || process.env.DB_NAME}\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

  for (const table of tableNames) {
    const [rows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = rows[0]['Create Table'] || rows[0]['Create Table'.toLowerCase()];
    output += `-- Table: ${table}\n` + createSql + `;\n\n`;
  }

  output += 'SET FOREIGN_KEY_CHECKS=1;\n';

  fs.writeFileSync(outFile, output);
  console.log('Schema exported successfully.');
  await conn.end();
})();

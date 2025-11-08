require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  if (!process.env.DB_USER && !process.env.DB_USERNAME && !process.env.DB_NAME && !process.env.DB_PASSWORD) {
    console.error('Database environment variables not set. Create a .env file or set DB_USER/DB_PASSWORD/DB_NAME and re-run.');
    process.exit(1);
  }

  try {
    // `src/config/database` exports a mysql2/promise pool directly
    await db.query("ALTER TABLE patients MODIFY gender ENUM('male','female','other') NULL");
    console.log('OK');
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();

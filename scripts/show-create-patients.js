require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  try {
    const [rows] = await db.query("SHOW CREATE TABLE patients");
    console.log(rows[0]['Create Table']);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();

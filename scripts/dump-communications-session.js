require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  try {
    const [rows] = await db.query('SELECT id, session_id, metadata, read_by FROM communications WHERE session_id = ?', [1]);
    console.log('Found', rows.length, 'rows');
    for (const r of rows) {
      console.log('--- id:', r.id);
      console.log('metadata:', r.metadata);
      console.log('read_by:', r.read_by);
    }
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();

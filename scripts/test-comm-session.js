require('dotenv').config();
const CommunicationModel = require('../src/models/Communication');

async function run() {
  try {
    const rows = await CommunicationModel.findBySession(1, 200);
    console.log('rows:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();

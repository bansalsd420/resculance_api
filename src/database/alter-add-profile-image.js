require('dotenv').config();
const db = require('../config/database');

async function migrate() {
  try {
    console.log('Running migration: add profile_image_url to users');

    // Only add the column if it doesn't already exist
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image_url'`
    );

    if (rows && rows.length > 0) {
      console.log('Column profile_image_url already exists on users table. Skipping.');
      return;
    }

  // Add the column without specifying position to avoid dependency on other column names
  await db.query(`ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(255) NULL`);
    console.log('✅ Added profile_image_url to users');
  } catch (error) {
    console.error('Failed to run alter-add-profile-image migration:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0));
}

module.exports = { migrate };

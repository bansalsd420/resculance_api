require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { ROLES, ORG_TYPES, USER_STATUS } = require('../config/constants');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Check if superadmin already exists
    const [existingAdmin] = await db.query(
      'SELECT id FROM users WHERE role = ? LIMIT 1',
      [ROLES.SUPERADMIN]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Superadmin already exists. Skipping seed.');
      process.exit(0);
    }

    // Create system organization for superadmin
    const [orgResult] = await db.query(
      `INSERT INTO organizations (name, code, type, status) VALUES (?, ?, ?, ?)`,
      ['System', 'SYS-001', ORG_TYPES.HOSPITAL, 'active']
    );

    const systemOrgId = orgResult.insertId;
    console.log('✅ System organization created');

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await db.query(
      `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        systemOrgId,
        'superadmin',
        'superadmin@resculance.com',
        hashedPassword,
        ROLES.SUPERADMIN,
        'Super',
        'Admin',
        USER_STATUS.ACTIVE
      ]
    );

    console.log('✅ Superadmin user created');
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Email: superadmin@resculance.com');
    console.log('   Password: Admin@123');
    console.log('\n⚠️  Please change this password immediately after first login!\n');

    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed();
}

module.exports = { seed };

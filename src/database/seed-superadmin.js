require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

/**
 * Seed Superadmin Organization and User
 * Creates a default superadmin organization and superadmin account for system access
 */
async function seedSuperadmin() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🏢 Seeding superadmin organization and user...\n');

    // Step 1: Create Superadmin Organization
    const organization = {
      name: 'Resculance Admin',
      code: 'ADMIN-ORG',
      type: 'superadmin',
      address: 'System Administration',
      city: 'N/A',
      state: 'N/A',
      country: 'India',
      contactPerson: 'System Administrator',
      contactEmail: 'admin@resculance.com',
      contactPhone: '+1234567890',
      status: 'active',
      isActive: true
    };

    // Check if superadmin organization already exists
    const [existingOrg] = await connection.query(
      'SELECT id, name, code FROM organizations WHERE code = ? OR type = ?',
      [organization.code, 'superadmin']
    );

    let organizationId;

    if (existingOrg.length > 0) {
      organizationId = existingOrg[0].id;
      console.log('⚠️  Superadmin organization already exists:');
      console.log(`   Name: ${existingOrg[0].name}`);
      console.log(`   Code: ${existingOrg[0].code}`);
      console.log(`   ID: ${organizationId}`);
    } else {
      // Insert superadmin organization
      const [orgResult] = await connection.query(
        `INSERT INTO organizations (
          name, 
          code, 
          type, 
          address, 
          city, 
          state, 
          country,
          contact_person,
          contact_email,
          contact_phone,
          status,
          is_active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          organization.name,
          organization.code,
          organization.type,
          organization.address,
          organization.city,
          organization.state,
          organization.country,
          organization.contactPerson,
          organization.contactEmail,
          organization.contactPhone,
          organization.status,
          organization.isActive
        ]
      );

      organizationId = orgResult.insertId;
      console.log('✅ Superadmin organization created successfully!');
      console.log(`   Name: ${organization.name}`);
      console.log(`   Code: ${organization.code}`);
      console.log(`   ID: ${organizationId}\n`);
    }

    // Step 2: Create Superadmin User
    const superadmin = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@resculance.com',
      phone: '+1234567890',
      password: 'Admin@123',
      role: 'superadmin',
      status: 'active',
      isApproved: true,
      organizationId: organizationId
    };

    // Check if superadmin user already exists
    const [existingUser] = await connection.query(
      'SELECT id, email FROM users WHERE email = ? OR role = ?',
      [superadmin.email, 'superadmin']
    );

    if (existingUser.length > 0) {
      console.log('\n⚠️  Superadmin user already exists:');
      console.log(`   Email: ${existingUser[0].email}`);
      console.log(`   ID: ${existingUser[0].id}`);
      console.log('\n✅ Skipping superadmin user creation');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(superadmin.password, 10);

    // Insert superadmin user
    const [userResult] = await connection.query(
      `INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        phone, 
        password, 
        role, 
        organization_id,
        status, 
        is_approved,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        superadmin.firstName,
        superadmin.lastName,
        superadmin.email,
        superadmin.phone,
        hashedPassword,
        superadmin.role,
        superadmin.organizationId,
        superadmin.status,
        superadmin.isApproved
      ]
    );

    console.log('\n✅ Superadmin user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Email:', superadmin.email);
    console.log('   Password:', superadmin.password);
    console.log('   Role:', superadmin.role);
    console.log('   Organization ID:', organizationId);
    console.log('   User ID:', userResult.insertId);
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedSuperadmin()
    .then(() => {
      console.log('\n✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedSuperadmin;

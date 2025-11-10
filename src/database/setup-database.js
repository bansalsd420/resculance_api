require('dotenv').config();
const runComprehensiveMigration = require('./comprehensive-migration');
const seedSuperadmin = require('./seed-superadmin');

/**
 * Setup Database - Migration + Superadmin Seed
 * Run this script to setup a fresh database
 */
async function setupDatabase() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║       RESCULANCE API - DATABASE SETUP                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Step 1: Run migrations
    console.log('📦 Step 1: Running database migrations...\n');
    await runComprehensiveMigration();

    console.log('\n' + '─'.repeat(60) + '\n');

    // Step 2: Seed superadmin
    console.log('👤 Step 2: Seeding superadmin user...\n');
    await seedSuperadmin();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ DATABASE SETUP COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\n🚀 You can now start the server with: npm start');
    console.log('🔐 Login with: admin@resculance.com / Admin@123\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

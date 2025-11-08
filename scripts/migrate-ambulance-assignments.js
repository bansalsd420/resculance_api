#!/usr/bin/env node
require('dotenv').config();
const db = require('../src/config/database');
const { migrateAll } = require('../src/database/migrate-all');

async function tableExists(tableName) {
  const [rows] = await db.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [tableName]);
  return rows.length > 0;
}

async function main() {
  const args = process.argv.slice(2);
  const doDrop = args.includes('--drop');
  const dryRun = args.includes('--dry-run');

  console.log('Starting ambulance assignments migration');

  // Ensure schema includes the new table
  console.log('Ensuring migrations have run (creating missing tables if any)...');
  await migrateAll();

  const hasOld = await tableExists('ambulance_user_mappings');
  const hasNew = await tableExists('ambulance_assignments');

  if (!hasNew) {
    console.error('Error: ambulance_assignments table still missing after migrations. Aborting.');
    process.exit(1);
  }

  if (!hasOld) {
    console.log('No old table `ambulance_user_mappings` found — nothing to migrate.');
    process.exit(0);
  }

  // Count active rows to migrate
  const [countRows] = await db.query('SELECT COUNT(*) as cnt FROM ambulance_user_mappings WHERE is_active = TRUE');
  const toMigrate = countRows[0].cnt || 0;
  console.log(`Found ${toMigrate} active assignment(s) to migrate.`);

  if (toMigrate === 0) {
    console.log('Nothing to migrate.');
    if (doDrop) {
      console.log('--drop passed but no rows to migrate. Skipping drop.');
    }
    process.exit(0);
  }

  if (dryRun) {
    console.log('--dry-run provided; not performing any writes. Exiting.');
    process.exit(0);
  }

  try {
    console.log('Starting transactional migration...');
    await db.query('START TRANSACTION');

    // Insert or update into ambulance_assignments from ambulance_user_mappings
    const insertSql = `
      INSERT INTO ambulance_assignments (ambulance_id, user_id, assigning_organization_id, assigned_by, role, is_active, assigned_at, created_at)
      SELECT
        aum.ambulance_id,
        aum.user_id,
        u.organization_id AS assigning_organization_id,
        aum.assigned_by,
        u.role AS role,
        aum.is_active,
        aum.assigned_at,
        NOW()
      FROM ambulance_user_mappings aum
      LEFT JOIN users u ON u.id = aum.assigned_by
      WHERE aum.is_active = TRUE
      ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), assigned_at = VALUES(assigned_at), assigned_by = VALUES(assigned_by), role = VALUES(role);
    `;

    const [result] = await db.query(insertSql);

    console.log('Migration query executed. Result:', { affectedRows: result.affectedRows, insertId: result.insertId });

    await db.query('COMMIT');

    console.log(`Successfully migrated ${toMigrate} active assignment(s) into ambulance_assignments.`);

    if (doDrop) {
      console.log('--drop flag present. Dropping old table `ambulance_user_mappings` now...');
      await db.query('DROP TABLE IF EXISTS ambulance_user_mappings');
      console.log('Dropped `ambulance_user_mappings`.');
    } else {
      console.log('Old table retained. To remove it, re-run with --drop after verifying the migration.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    try { await db.query('ROLLBACK'); } catch (e) {}
    process.exit(1);
  }
}

main();

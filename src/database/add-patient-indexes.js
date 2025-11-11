require('dotenv').config();
const db = require('../config/database');

async function addPatientIndexes() {
  console.log('🔧 Ensuring patient table indexes for performance...');

  // Check existing indexes
  const [rows] = await db.query(`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients'
  `);
  const existing = rows.map(r => r.INDEX_NAME);

  if (!existing.includes('idx_patients_is_active')) {
    await db.query(`ALTER TABLE patients ADD INDEX idx_patients_is_active (is_active)`);
    console.log('  ✓ Added idx_patients_is_active');
  }

  if (!existing.includes('idx_patients_org_is_active_created_at')) {
    await db.query(`ALTER TABLE patients ADD INDEX idx_patients_org_is_active_created_at (organization_id, is_active, created_at)`);
    console.log('  ✓ Added idx_patients_org_is_active_created_at');
  }

  if (!existing.includes('idx_patient_code')) {
    // patient_code index likely exists but ensure a compact name
    try {
      await db.query(`ALTER TABLE patients ADD INDEX idx_patient_code (patient_code)`);
      console.log('  ✓ Added idx_patient_code');
    } catch (e) {
      // ignore if duplicate
    }
  }

  console.log('✅ Patient indexes ensured.');
}

if (require.main === module) {
  addPatientIndexes().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = addPatientIndexes;

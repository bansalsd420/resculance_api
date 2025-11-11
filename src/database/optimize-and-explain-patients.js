require('dotenv').config();
const db = require('../config/database');

async function ensurePatientSessionIndexes() {
  console.log('🔧 Ensuring patient_sessions indexes...');
  const [rows] = await db.query(`
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_sessions'
  `);
  const existing = rows.map(r => r.INDEX_NAME);

  if (!existing.includes('idx_ps_patient_status_created')) {
    await db.query(`ALTER TABLE patient_sessions ADD INDEX idx_ps_patient_status_created (patient_id, status, created_at)`);
    console.log('  ✓ Added idx_ps_patient_status_created');
  } else {
    console.log('  - idx_ps_patient_status_created already exists');
  }

  if (!existing.includes('idx_ps_ambulance_id')) {
    await db.query(`ALTER TABLE patient_sessions ADD INDEX idx_ps_ambulance_id (ambulance_id)`);
    console.log('  ✓ Added idx_ps_ambulance_id');
  } else {
    console.log('  - idx_ps_ambulance_id already exists');
  }

  console.log('✅ patient_sessions indexes ensured.');
}

async function explainPatientsQuery() {
  console.log('\n📈 Running EXPLAIN for patients query (with and without is_active filter)');
  // pick an example organization_id if available
  const [p] = await db.query('SELECT organization_id FROM patients WHERE organization_id IS NOT NULL LIMIT 1');
  const orgId = (p && p[0] && p[0].organization_id) ? p[0].organization_id : null;

  const base = `SELECT p.*, (
    SELECT ps.status FROM patient_sessions ps WHERE ps.patient_id = p.id ORDER BY ps.created_at DESC LIMIT 1
  ) as latest_session_status FROM patients p WHERE 1=1`;

  const qActive = base + (orgId ? ' AND organization_id = ?' : '') + ' AND is_active = TRUE';
  const qAll = base + (orgId ? ' AND organization_id = ?' : '');

  try {
    const [ex1] = await db.query('EXPLAIN ' + qActive, orgId ? [orgId] : []);
    console.log('\nEXPLAIN (active only):');
    console.table(ex1);
  } catch (e) {
    console.error('Failed to EXPLAIN active query:', e.message || e);
  }

  try {
    const [ex2] = await db.query('EXPLAIN ' + qAll, orgId ? [orgId] : []);
    console.log('\nEXPLAIN (all):');
    console.table(ex2);
  } catch (e) {
    console.error('Failed to EXPLAIN all query:', e.message || e);
  }
}

async function main() {
  try {
    await ensurePatientSessionIndexes();
    await explainPatientsQuery();
    process.exit(0);
  } catch (err) {
    console.error('Error in optimization script:', err);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { ensurePatientSessionIndexes, explainPatientsQuery };

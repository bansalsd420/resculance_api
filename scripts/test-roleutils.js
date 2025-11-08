const { normalizeRole, normalizeStatus } = require('../src/utils/roleUtils');

(async () => {
  try {
    console.log('normalizeRole("DOCTOR", "hospital"):');
    console.log(await normalizeRole('DOCTOR', 'hospital'));

    console.log('normalizeRole("DOCTOR", "fleet_owner"):');
    console.log(await normalizeRole('DOCTOR', 'fleet_owner'));

    console.log('normalizeRole("hospital_doctor") ->');
    console.log(await normalizeRole('hospital_doctor'));

    console.log('normalizeRole("driver", fleet_owner):');
    console.log(await normalizeRole('driver', 'fleet_owner'));

    console.log('normalizeStatus("pending") ->', normalizeStatus('pending'));
    console.log('normalizeStatus("pending_approval") ->', normalizeStatus('pending_approval'));
    console.log('normalizeStatus("active") ->', normalizeStatus('active'));
  } catch (err) {
    console.error('Error:', err.message || err);
  }
})();

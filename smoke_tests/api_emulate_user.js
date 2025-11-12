require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}/api/${process.env.API_VERSION || 'v1'}`;

async function runAsUser(user) {
  const token = jwt.sign({
    id: user.id,
    role: user.role,
    organizationId: user.organization_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email
  }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', { expiresIn: '1h' });

  const headers = { Authorization: `Bearer ${token}` };
  console.log('Using API base:', API_BASE);

  // Fetch ambulances for user's org
  const ambResp = await axios.get(`${API_BASE}/ambulances`, { params: { organizationId: user.organization_id }, headers }).catch(e => { throw e; });
  const ambData = ambResp.data?.data?.ambulances || ambResp.data?.ambulances || ambResp.data || [];
  console.log(`Ambulances for org ${user.organization_id}:`, ambData.map(a => `${a.id}:${a.registration_number}`));

  // Fetch collaborations (approved)
  const collResp = await axios.get(`${API_BASE}/collaborations`, { params: { status: 'approved' }, headers }).catch(e => { throw e; });
  const collData = collResp.data?.data?.requests || collResp.data?.requests || collResp.data || [];
  console.log('Collaborations (approved):', collData.map(c => ({id: c.id, hospital_id: c.hospital_id || c.hospitalId, fleet_id: c.fleet_id || c.fleetId })));

  // Determine partnered fleets for this hospital
  const fleetIds = collData.filter(c => Number(c.hospital_id || c.hospitalId) === Number(user.organization_id)).map(c => c.fleet_id || c.fleetId);
  console.log('Partner fleets for this hospital:', fleetIds);

  for (const fid of fleetIds) {
    const fAmb = await axios.get(`${API_BASE}/ambulances`, { params: { organizationId: fid }, headers }).catch(e => { throw e; });
    const list = fAmb.data?.data?.ambulances || fAmb.data?.ambulances || fAmb.data || [];
    console.log(`Fleet ${fid} ambulances:`, list.map(a => `${a.id}:${a.registration_number}`));
  }
}

(async () => {
  try {
    // Emulate hospital admin (apex-admin)
    const hospitalUser = { id: 46, email: 'apex-admin@gmail.com', role: 'hospital_admin', organization_id: 15, first_name: 'apex-admin-new', last_name: 'admin' };
    console.log('\n=== Emulating hospital admin ===');
    await runAsUser(hospitalUser);

    // Emulate superadmin selecting the same hospital (simulate selectedOrgId path)
    const superUser = { id: 1, email: 'admin@resculance.com', role: 'superadmin', organization_id: 1, first_name: 'Super', last_name: 'Admin' };
    console.log('\n=== Emulating superadmin (selecting org 15) ===');
    // For superadmin we will call ambulances with organizationId=15
    const token = jwt.sign({ id: superUser.id, role: superUser.role, organizationId: superUser.organization_id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', { expiresIn: '1h' });
    const headers = { Authorization: `Bearer ${token}` };
    const ambResp = await axios.get(`${API_BASE}/ambulances`, { params: { organizationId: 15 }, headers });
    const ambData = ambResp.data?.data?.ambulances || ambResp.data?.ambulances || ambResp.data || [];
    console.log('Superadmin fetched ambulances for org 15:', ambData.map(a => `${a.id}:${a.registration_number}`));

  } catch (err) {
    if (err.response) {
      console.error('API error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();

const axios = require('axios');

(async () => {
  try {
    const api = process.env.API_BASE || 'http://localhost:5000/api/v1';
    const login = await axios.post(`${api}/auth/login`, { email: 'superadmin@resculance.com', password: 'Super@123' });
    const token = login.data.data.accessToken;
    const resp = await axios.get(`${api}/users`, { headers: { Authorization: `Bearer ${token}` }, params: { role: 'DOCTOR', limit: 100 } });
    console.log('Returned count:', resp.data.data.users.length);
    console.log(resp.data.data.users.map(u => ({ id: u.id, email: u.email, role: u.role, org: u.organization_code })));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
})();

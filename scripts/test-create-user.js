const axios = require('axios');

(async () => {
  try {
    const apiBase = process.env.API_BASE || 'http://localhost:5000/api/v1';

    // login
    const loginResp = await axios.post(`${apiBase}/auth/login`, { email: 'superadmin@resculance.com', password: 'Super@123' });
    const token = loginResp.data.data.accessToken;
    console.log('Logged in, token length:', token.length);

    // create user
    const userData = {
      email: `testuser_${Date.now()}@example.com`,
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'User',
      phone: '+911111111111',
      role: 'DOCTOR',
      organizationId: 2
    };

    const createResp = await axios.post(`${apiBase}/users`, userData, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Create response:', createResp.data);

    // fetch pending users
    const pending = await axios.get(`${apiBase}/users`, { headers: { Authorization: `Bearer ${token}` }, params: { status: 'pending_approval' } });
    console.log('Pending users count:', pending.data.data.users.length);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
})();

const axios = require('axios');

(async () => {
  try {
    const apiBase = process.env.API_BASE || 'http://localhost:5000/api/v1';

    // login
    const loginResp = await axios.post(`${apiBase}/auth/login`, { email: 'superadmin@resculance.com', password: 'Super@123' });
    const token = loginResp.data.data.accessToken;
    console.log('Logged in, token length:', token.length);

    // fetch pending users
    const pendingResp = await axios.get(`${apiBase}/users`, { headers: { Authorization: `Bearer ${token}` }, params: { status: 'pending_approval', limit: 10 } });
    const pending = pendingResp.data.data.users;
    console.log('Pending users count:', pending.length);
    if (pending.length === 0) {
      console.log('No pending users to approve.');
      return;
    }

    const userToApprove = pending[0];
    console.log('Approving user:', userToApprove.id, userToApprove.email);

    const approveResp = await axios.patch(`${apiBase}/users/${userToApprove.id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Approve response:', approveResp.data);

    // verify status
    const getResp = await axios.get(`${apiBase}/users/${userToApprove.id}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('User status now:', getResp.data.data.user.status);

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
})();

const fetch = globalThis.fetch || require('node-fetch');

(async () => {
  const base = 'http://localhost:5001/api/v1';
  try {
    console.log('Logging in...');
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@resculance.com', password: 'Super@123' })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed', loginJson);
      process.exit(1);
    }
    const token = loginJson.data.accessToken;
    console.log('Token received:', token && token.slice(0,20) + '...');

    console.log('Creating patient...');
    const createRes = await fetch(`${base}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: 'AutoTest', lastName: 'Patient', dateOfBirth: '1990-01-01', gender: 'male' })
    });
    const createJson = await createRes.json();
    console.log('Create response:', createJson);
    if (!createRes.ok) process.exit(1);
    const patientId = createJson.data.patientId;

    console.log('Updating patient...');
    const updateRes = await fetch(`${base}/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lastName: 'Updated' })
    });
    const updateJson = await updateRes.json();
    console.log('Update response:', updateJson);

    console.log('Adding vital signs (with null heartRate)...');
    const vitalsRes = await fetch(`${base}/patients/${patientId}/vital-signs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ heartRate: null, bloodPressureSystolic: 120, bloodPressureDiastolic: 80 })
    });
    const vitalsJson = await vitalsRes.json();
    console.log('Vitals response:', vitalsJson);

    console.log('API tests completed');
  } catch (err) {
    console.error('Error during API test:', err);
    process.exit(1);
  }
})();

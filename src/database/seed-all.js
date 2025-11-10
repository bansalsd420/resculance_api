require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedAll() {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // Step 1: Create System Organization
    console.log('📋 Step 1: Creating system organization...');
    const systemOrgId = await createSystemOrganization();
    console.log(`✅ System organization created (ID: ${systemOrgId})\n`);

    // Step 2: Create Superadmin
    console.log('📋 Step 2: Creating superadmin user...');
    const superadminId = await createSuperadmin(systemOrgId);
    console.log(`✅ Superadmin created (ID: ${superadminId})\n`);

    // Step 3: Create Organizations
    console.log('📋 Step 3: Creating organizations...');
    const orgIds = await createOrganizations(superadminId);
    console.log(`✅ Created ${Object.keys(orgIds).length} organizations\n`);

    // Step 4: Create Users
    console.log('📋 Step 4: Creating users...');
    const userIds = await createUsers(orgIds, superadminId);
    console.log(`✅ Created users for all organizations\n`);

    // Step 5: Create Ambulances
    console.log('📋 Step 5: Creating ambulances...');
    const ambulanceIds = await createAmbulances(orgIds, userIds);
    console.log(`✅ Created ${ambulanceIds.length} ambulances\n`);

    // Step 6: Create Ambulance Devices
    console.log('📋 Step 6: Creating ambulance devices...');
    await createAmbulanceDevices(ambulanceIds, userIds);
    console.log(`✅ Created devices for ambulances\n`);

    // Step 7: Assign Users to Ambulances
    console.log('📋 Step 7: Assigning staff to ambulances...');
    await assignUsersToAmbulances(ambulanceIds, userIds);
    console.log(`✅ Staff assigned to ambulances\n`);

    // Step 8: Create Patients
    console.log('📋 Step 8: Creating patients...');
    const patientIds = await createPatients(orgIds, userIds);
    console.log(`✅ Created ${patientIds.length} patients\n`);

    // Step 9: Create Patient Sessions
    console.log('📋 Step 9: Creating patient sessions (trips)...');
    const sessionIds = await createPatientSessions(patientIds, ambulanceIds, orgIds, userIds);
    console.log(`✅ Created ${sessionIds.length} patient sessions\n`);

    // Step 10: Create Vital Signs
    console.log('📋 Step 10: Creating vital signs records...');
    await createVitalSigns(patientIds, sessionIds, userIds);
    console.log(`✅ Created vital signs records\n`);

    // Step 11: Create Collaboration Requests
    console.log('📋 Step 11: Creating collaboration requests...');
    await createCollaborationRequests(orgIds, userIds);
    console.log(`✅ Created collaboration requests\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Superadmin:');
    console.log('  Email: superadmin@resculance.com');
    console.log('  Password: Super@123\n');
    console.log('AIIMS Delhi (Hospital Admin):');
    console.log('  Email: admin@aiims.delhi');
    console.log('  Password: Admin@123\n');
    console.log('FastAid Fleet (Fleet Admin):');
    console.log('  Email: admin@fastaid.com');
    console.log('  Password: Admin@123\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function createSystemOrganization() {
  const [result] = await db.query(
    `INSERT INTO organizations (name, code, type, status, contact_email) 
     VALUES ('Resculance System', 'SYSTEM', 'hospital', 'active', 'system@resculance.com')`
  );
  return result.insertId;
}

async function createSuperadmin(organizationId) {
  const hashedPassword = await bcrypt.hash('Super@123', 10);
  const [result] = await db.query(
    `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, phone, status, created_by)
     VALUES (?, 'superadmin', 'superadmin@resculance.com', ?, 'superadmin', 'Super', 'Admin', '+919999999999', 'active', NULL)`,
    [organizationId, hashedPassword]
  );
  return result.insertId;
}

async function createOrganizations(createdBy) {
  const orgs = [
    { name: 'AIIMS Delhi', code: 'AIIMS-DEL', type: 'hospital', city: 'New Delhi', state: 'Delhi', contact: 'Dr. Kumar', email: 'contact@aiims.delhi', phone: '+911126588500' },
    { name: 'Apollo Hospital', code: 'APOLLO-DEL', type: 'hospital', city: 'New Delhi', state: 'Delhi', contact: 'Dr. Sharma', email: 'contact@apollo.com', phone: '+911126925858' },
    { name: 'Max Super Specialty', code: 'MAX-GUR', type: 'hospital', city: 'Gurugram', state: 'Haryana', contact: 'Dr. Mehta', email: 'contact@maxhealthcare.com', phone: '+911244211111' },
    { name: 'Fortis Hospital', code: 'FORTIS-NOI', type: 'hospital', city: 'Noida', state: 'Uttar Pradesh', contact: 'Dr. Verma', email: 'contact@fortishealthcare.com', phone: '+911204799222' },
    { name: 'FastAid Ambulance Fleet', code: 'FASTAID', type: 'fleet_owner', city: 'New Delhi', state: 'Delhi', contact: 'Mr. Singh', email: 'ops@fastaid.com', phone: '+911142000000' },
    { name: 'LifeLine Emergency Services', code: 'LIFELINE', type: 'fleet_owner', city: 'Gurugram', state: 'Haryana', contact: 'Mr. Gupta', email: 'ops@lifeline.com', phone: '+911242000000' },
  ];

  const orgIds = {};
  for (const org of orgs) {
    const [result] = await db.query(
      `INSERT INTO organizations (name, code, type, city, state, country, contact_person, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, 'India', ?, ?, ?, 'active')`,
      [org.name, org.code, org.type, org.city, org.state, org.contact, org.email, org.phone]
    );
    orgIds[org.code] = result.insertId;
  }
  return orgIds;
}

async function createUsers(orgIds, createdBy) {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const hashedDoctorPassword = await bcrypt.hash('Doctor@123', 10);
  const hashedStaffPassword = await bcrypt.hash('Staff@123', 10);

  const users = [
    // AIIMS Delhi
    { orgCode: 'AIIMS-DEL', username: 'aiims_admin', email: 'admin@aiims.delhi', password: hashedPassword, role: 'hospital_admin', firstName: 'Rajesh', lastName: 'Kumar', phone: '+919876543210' },
    { orgCode: 'AIIMS-DEL', username: 'dr_sharma', email: 'sharma@aiims.delhi', password: hashedDoctorPassword, role: 'hospital_doctor', firstName: 'Amit', lastName: 'Sharma', phone: '+919876543211' },
    { orgCode: 'AIIMS-DEL', username: 'nurse_priya', email: 'priya@aiims.delhi', password: hashedStaffPassword, role: 'hospital_paramedic', firstName: 'Priya', lastName: 'Singh', phone: '+919876543212' },
    
    // Apollo Hospital
    { orgCode: 'APOLLO-DEL', username: 'apollo_admin', email: 'admin@apollo.com', password: hashedPassword, role: 'hospital_admin', firstName: 'Suresh', lastName: 'Mehta', phone: '+919876543220' },
    { orgCode: 'APOLLO-DEL', username: 'dr_gupta', email: 'gupta@apollo.com', password: hashedDoctorPassword, role: 'hospital_doctor', firstName: 'Rakesh', lastName: 'Gupta', phone: '+919876543221' },
    
    // Max Hospital
    { orgCode: 'MAX-GUR', username: 'max_admin', email: 'admin@maxhealthcare.com', password: hashedPassword, role: 'hospital_admin', firstName: 'Vikram', lastName: 'Verma', phone: '+919876543230' },
    { orgCode: 'MAX-GUR', username: 'dr_kapoor', email: 'kapoor@maxhealthcare.com', password: hashedDoctorPassword, role: 'hospital_doctor', firstName: 'Anjali', lastName: 'Kapoor', phone: '+919876543231' },
    
    // Fortis Hospital
    { orgCode: 'FORTIS-NOI', username: 'fortis_admin', email: 'admin@fortishealthcare.com', password: hashedPassword, role: 'hospital_admin', firstName: 'Deepak', lastName: 'Malhotra', phone: '+919876543240' },
    
    // FastAid Fleet
    { orgCode: 'FASTAID', username: 'fastaid_admin', email: 'admin@fastaid.com', password: hashedPassword, role: 'fleet_admin', firstName: 'Manish', lastName: 'Singh', phone: '+919876543250' },
    { orgCode: 'FASTAID', username: 'fastaid_staff', email: 'staff@fastaid.com', password: hashedStaffPassword, role: 'fleet_staff', firstName: 'Rahul', lastName: 'Kumar', phone: '+919876543251' },
    { orgCode: 'FASTAID', username: 'dr_pandey', email: 'pandey@fastaid.com', password: hashedDoctorPassword, role: 'fleet_doctor', firstName: 'Sanjay', lastName: 'Pandey', phone: '+919876543252' },
    { orgCode: 'FASTAID', username: 'paramedic_raj', email: 'raj@fastaid.com', password: hashedStaffPassword, role: 'fleet_paramedic', firstName: 'Raj', lastName: 'Patel', phone: '+919876543253' },
    
    // LifeLine Fleet
    { orgCode: 'LIFELINE', username: 'lifeline_admin', email: 'admin@lifeline.com', password: hashedPassword, role: 'fleet_admin', firstName: 'Arun', lastName: 'Gupta', phone: '+919876543260' },
    { orgCode: 'LIFELINE', username: 'dr_reddy', email: 'reddy@lifeline.com', password: hashedDoctorPassword, role: 'fleet_doctor', firstName: 'Kiran', lastName: 'Reddy', phone: '+919876543261' },
  ];

  const userIds = {};
  for (const user of users) {
    const [result] = await db.query(
      `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, phone, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [orgIds[user.orgCode], user.username, user.email, user.password, user.role, user.firstName, user.lastName, user.phone, createdBy]
    );
    userIds[user.username] = result.insertId;
  }
  return userIds;
}

async function createAmbulances(orgIds, userIds) {
  const ambulances = [
    { orgCode: 'FASTAID', code: 'FA-AMB-001', regNo: 'DL-01-AB-1234', model: 'Force Traveller', type: 'BLS', status: 'active' },
    { orgCode: 'FASTAID', code: 'FA-AMB-002', regNo: 'DL-01-AB-5678', model: 'Tata Winger', type: 'ALS', status: 'active' },
    { orgCode: 'FASTAID', code: 'FA-AMB-003', regNo: 'DL-01-AB-9012', model: 'Mahindra Supro', type: 'BLS', status: 'available' },
    { orgCode: 'LIFELINE', code: 'LL-AMB-001', regNo: 'HR-26-CD-3456', model: 'Force Traveller', type: 'ALS', status: 'active' },
    { orgCode: 'LIFELINE', code: 'LL-AMB-002', regNo: 'HR-26-CD-7890', model: 'Eicher', type: 'SCU', status: 'available' },
  ];

  const ambulanceIds = [];
  for (const amb of ambulances) {
    const createdBy = amb.orgCode === 'FASTAID' ? userIds['fastaid_admin'] : userIds['lifeline_admin'];
    const [result] = await db.query(
      `INSERT INTO ambulances (organization_id, ambulance_code, registration_number, vehicle_model, vehicle_type, status, created_by, approved_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [orgIds[amb.orgCode], amb.code, amb.regNo, amb.model, amb.type, amb.status, createdBy, createdBy]
    );
    ambulanceIds.push(result.insertId);
  }
  return ambulanceIds;
}

async function createAmbulanceDevices(ambulanceIds, userIds) {
  const devices = [
    { ambIdx: 0, name: 'Front Camera', type: 'CAMERA', deviceId: '100000000001', username: 'testing', password: 'Testing@123', api: 'http://205.147.109.152', manufacturer: '808GPS', model: 'CAM-100' },
    { ambIdx: 0, name: 'Patient Bay Camera', type: 'CAMERA', deviceId: '100000000002', username: 'testing', password: 'Testing@123', api: 'http://205.147.109.152', manufacturer: '808GPS', model: 'CAM-100' },
    { ambIdx: 0, name: 'GPS Tracker', type: 'GPS_TRACKER', deviceId: 'GPS-001', manufacturer: 'Garmin', model: 'GPSMAP' },
    { ambIdx: 1, name: 'Main Camera', type: 'CAMERA', deviceId: '100000000003', username: 'testing', password: 'Testing@123', api: 'http://205.147.109.152', manufacturer: '808GPS', model: 'CAM-100' },
    { ambIdx: 1, name: 'ECG Monitor', type: 'ECG', deviceId: 'ECG-001', manufacturer: 'Philips', model: 'HeartStart' },
  ];

  for (const device of devices) {
    await db.query(
      `INSERT INTO ambulance_devices (ambulance_id, device_name, device_type, device_id, device_username, device_password, device_api, manufacturer, model, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [ambulanceIds[device.ambIdx], device.name, device.type, device.deviceId, device.username, device.password, device.api, device.manufacturer, device.model]
    );
  }
}

async function assignUsersToAmbulances(ambulanceIds, userIds) {
  const assignments = [
    { ambIdx: 0, username: 'dr_pandey', assignedBy: 'fastaid_admin' },
    { ambIdx: 0, username: 'paramedic_raj', assignedBy: 'fastaid_admin' },
    { ambIdx: 1, username: 'dr_pandey', assignedBy: 'fastaid_admin' },
    { ambIdx: 3, username: 'dr_reddy', assignedBy: 'lifeline_admin' },
  ];

  for (const assignment of assignments) {
    await db.query(
      `INSERT INTO ambulance_user_mappings (ambulance_id, user_id, assigned_by, is_active)
       VALUES (?, ?, ?, TRUE)`,
      [ambulanceIds[assignment.ambIdx], userIds[assignment.username], userIds[assignment.assignedBy]]
    );
  }
}

async function createPatients(orgIds, userIds) {
  const patients = [
  { orgCode: 'AIIMS-DEL', code: 'PAT-AIIMS-001', firstName: 'Ramesh', lastName: 'Kumar', age: 38, gender: 'male', bloodGroup: 'O+', phone: '+919123456789', createdBy: 'aiims_admin' },
  { orgCode: 'AIIMS-DEL', code: 'PAT-AIIMS-002', firstName: 'Sita', lastName: 'Devi', age: 31, gender: 'female', bloodGroup: 'A+', phone: '+919123456790', createdBy: 'aiims_admin' },
  { orgCode: 'APOLLO-DEL', code: 'PAT-APOLLO-001', firstName: 'Arjun', lastName: 'Singh', age: 45, gender: 'male', bloodGroup: 'B+', phone: '+919123456791', createdBy: 'apollo_admin' },
  { orgCode: 'MAX-GUR', code: 'PAT-MAX-001', firstName: 'Meena', lastName: 'Sharma', age: 28, gender: 'female', bloodGroup: 'AB+', phone: '+919123456792', createdBy: 'max_admin' },
  { orgCode: 'FORTIS-NOI', code: 'PAT-FORTIS-001', firstName: 'Vijay', lastName: 'Malhotra', age: 35, gender: 'male', bloodGroup: 'O-', phone: '+919123456793', createdBy: 'fortis_admin' },
  ];

  const patientIds = [];
  for (const patient of patients) {
    const [result] = await db.query(
      `INSERT INTO patients (organization_id, patient_code, first_name, last_name, age, gender, blood_group, phone, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgIds[patient.orgCode], patient.code, patient.firstName, patient.lastName, patient.age, patient.gender, patient.bloodGroup, patient.phone, userIds[patient.createdBy]]
    );
    patientIds.push(result.insertId);
  }
  return patientIds;
}

async function createPatientSessions(patientIds, ambulanceIds, orgIds, userIds) {
  const sessions = [
    { patientIdx: 0, ambIdx: 0, orgCode: 'AIIMS-DEL', sessionCode: 'TRIP-001', status: 'in_transit', pickup: 'Connaught Place, Delhi', pickupLat: 28.6289, pickupLng: 77.2065, destHospital: 'APOLLO-DEL', chiefComplaint: 'Chest pain', onboardedBy: 'dr_pandey' },
    { patientIdx: 1, ambIdx: 1, orgCode: 'AIIMS-DEL', sessionCode: 'TRIP-002', status: 'offboarded', pickup: 'Karol Bagh, Delhi', pickupLat: 28.6517, pickupLng: 77.1903, destHospital: 'AIIMS-DEL', chiefComplaint: 'Severe headache', onboardedBy: 'dr_pandey' },
    { patientIdx: 2, ambIdx: 3, orgCode: 'APOLLO-DEL', sessionCode: 'TRIP-003', status: 'onboarded', pickup: 'Nehru Place, Delhi', pickupLat: 28.5494, pickupLng: 77.2501, destHospital: 'MAX-GUR', chiefComplaint: 'Abdominal pain', onboardedBy: 'dr_reddy' },
  ];

  const sessionIds = [];
  for (const session of sessions) {
    const onboardedAt = session.status === 'offboarded' ? new Date(Date.now() - 2 * 60 * 60 * 1000) : new Date();
    const offboardedAt = session.status === 'offboarded' ? new Date() : null;
    
    const [result] = await db.query(
      `INSERT INTO patient_sessions (patient_id, ambulance_id, organization_id, session_code, status, pickup_location, pickup_latitude, pickup_longitude, destination_hospital_id, chief_complaint, onboarded_by, onboarded_at, offboarded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientIds[session.patientIdx], ambulanceIds[session.ambIdx], orgIds[session.orgCode], session.sessionCode, session.status, session.pickup, session.pickupLat, session.pickupLng, orgIds[session.destHospital], session.chiefComplaint, userIds[session.onboardedBy], onboardedAt, offboardedAt]
    );
    sessionIds.push(result.insertId);
  }
  return sessionIds;
}

async function createVitalSigns(patientIds, sessionIds, userIds) {
  const vitals = [
    { patientIdx: 0, sessionIdx: 0, hr: 78, bpSys: 120, bpDia: 80, temp: 98.6, rr: 16, spo2: 98, recordedBy: 'dr_pandey' },
    { patientIdx: 0, sessionIdx: 0, hr: 82, bpSys: 125, bpDia: 82, temp: 98.8, rr: 18, spo2: 97, recordedBy: 'paramedic_raj' },
    { patientIdx: 1, sessionIdx: 1, hr: 72, bpSys: 118, bpDia: 78, temp: 98.4, rr: 15, spo2: 99, recordedBy: 'dr_pandey' },
  ];

  for (const vital of vitals) {
    await db.query(
      `INSERT INTO vital_signs (patient_id, session_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, temperature, respiratory_rate, oxygen_saturation, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientIds[vital.patientIdx], sessionIds[vital.sessionIdx], vital.hr, vital.bpSys, vital.bpDia, vital.temp, vital.rr, vital.spo2, userIds[vital.recordedBy]]
    );
  }
}

async function createCollaborationRequests(orgIds, userIds) {
  const requests = [
    { hospitalCode: 'AIIMS-DEL', fleetCode: 'FASTAID', type: 'partnership', status: 'approved', message: 'Partnership for emergency services', requestedBy: 'aiims_admin', approvedBy: 'fastaid_admin' },
    { hospitalCode: 'APOLLO-DEL', fleetCode: 'LIFELINE', type: 'partnership', status: 'pending', message: 'Requesting partnership', requestedBy: 'apollo_admin', approvedBy: null },
    { hospitalCode: 'MAX-GUR', fleetCode: 'FASTAID', type: 'one_time', status: 'approved', message: 'One-time collaboration', requestedBy: 'max_admin', approvedBy: 'fastaid_admin' },
  ];

  for (const req of requests) {
    const approvedAt = req.status === 'approved' ? new Date() : null;
    await db.query(
      `INSERT INTO collaboration_requests (hospital_id, fleet_id, request_type, status, message, requested_by, approved_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgIds[req.hospitalCode], orgIds[req.fleetCode], req.type, req.status, req.message, userIds[req.requestedBy], req.approvedBy ? userIds[req.approvedBy] : null, approvedAt]
    );
  }
}

if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };

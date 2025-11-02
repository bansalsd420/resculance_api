require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { ROLES, ORG_TYPES, USER_STATUS } = require('../config/constants');

// Helper to generate random dates
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function seedComprehensive() {
  try {
    console.log('🚀 Starting comprehensive database seeding...\n');

    // Check if data already exists
    const [existingOrgs] = await db.query('SELECT COUNT(*) as count FROM organizations');
    if (existingOrgs[0].count > 1) {
      console.log('⚠️  Data already exists. Skipping comprehensive seed.');
      console.log('   Run `npm run db:reset` to reset the database first.\n');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // ============= CREATE SYSTEM ORG FOR SUPERADMIN =============
    console.log('🔧 Creating System Organization for Superadmin...');
    const [systemOrgResult] = await db.query(
      `INSERT INTO organizations (name, code, type, address, status)
       VALUES (?, ?, ?, ?, ?)`,
      ['Resculance System', 'SYS-001', ORG_TYPES.HOSPITAL, 'Resculance HQ', 'active']
    );
    const systemOrgId = systemOrgResult.insertId;
    console.log('  ✅ System Organization\n');

    // ============= CREATE SUPERADMIN =============
    console.log('👑 Creating Superadmin...');
    const [superadminResult] = await db.query(
      `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [systemOrgId, 'superadmin', 'superadmin@resculance.com', hashedPassword, ROLES.SUPERADMIN, 'Super', 'Admin', USER_STATUS.ACTIVE]
    );
    console.log('  ✅ Superadmin User\n');

    // ============= CREATE ONE HOSPITAL =============
    console.log('🏥 Creating Hospital...');
    const [hospitalResult] = await db.query(
      `INSERT INTO organizations (name, code, type, address, contact_person, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Apollo Hospitals', 'HOSP-001', ORG_TYPES.HOSPITAL, 'Andheri West, Mumbai, Maharashtra', 'Dr. Ravi Kumar', 'admin@apollo.com', '+91-9876543210', 'active']
    );
    const hospitalId = hospitalResult.insertId;
    console.log('  ✅ Apollo Hospitals\n');

    // ============= CREATE ONE FLEET =============
    console.log('🚛 Creating Fleet Owner...');
    const [fleetResult] = await db.query(
      `INSERT INTO organizations (name, code, type, address, contact_person, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['QuickResponse Fleet', 'FLEET-001', ORG_TYPES.FLEET_OWNER, 'Andheri East, Mumbai, Maharashtra', 'Suresh Ambulance', 'admin@quickresponse.com', '+91-9876554321', 'active']
    );
    const fleetId = fleetResult.insertId;
    console.log('  ✅ QuickResponse Fleet\n');

    // ============= HOSPITAL USERS =============
    console.log('�‍⚕️ Creating Hospital Users...');
    const hospitalUsers = [
      // Hospital Admin
      { username: 'apollo_admin', email: 'admin@apollo.com', role: 'hospital_admin', firstName: 'Ravi', lastName: 'Kumar' },
      // Hospital Doctors
      { username: 'dr_shah', email: 'dr.shah@apollo.com', role: 'hospital_doctor', firstName: 'Anjali', lastName: 'Shah' },
      { username: 'dr_mehta', email: 'dr.mehta@apollo.com', role: 'hospital_doctor', firstName: 'Vikram', lastName: 'Mehta' },
      // Hospital Paramedics
      { username: 'para_raj', email: 'raj.p@apollo.com', role: 'hospital_paramedic', firstName: 'Raj', lastName: 'Malhotra' },
      { username: 'para_lakshmi', email: 'lakshmi.p@apollo.com', role: 'hospital_paramedic', firstName: 'Lakshmi', lastName: 'Nair' },
      // Hospital Staff
      { username: 'staff_neha', email: 'neha@apollo.com', role: 'hospital_staff', firstName: 'Neha', lastName: 'Verma' },
    ];

    const hospitalUserIds = [];
    for (const user of hospitalUsers) {
      const [result] = await db.query(
        `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [hospitalId, user.username, user.email, hashedPassword, user.role, user.firstName, user.lastName, USER_STATUS.ACTIVE]
      );
      hospitalUserIds.push({ id: result.insertId, role: user.role, email: user.email });
      console.log(`  ✅ ${user.firstName} ${user.lastName} (${user.role})`);
    }

    // ============= FLEET USERS =============
    console.log('🚑 Creating Fleet Users...');
    const fleetUsers = [
      // Fleet Admin
      { username: 'quick_admin', email: 'admin@quickresponse.com', role: 'fleet_admin', firstName: 'Suresh', lastName: 'Rane' },
      // Fleet Paramedics
      { username: 'fleet_para1', email: 'para1@quickresponse.com', role: 'fleet_paramedic', firstName: 'Ramesh', lastName: 'Kulkarni' },
      { username: 'fleet_para2', email: 'para2@quickresponse.com', role: 'fleet_paramedic', firstName: 'Sunil', lastName: 'Gowda' },
      // Fleet Staff
      { username: 'driver_amit', email: 'amit@quickresponse.com', role: 'fleet_staff', firstName: 'Amit', lastName: 'Shinde' },
      { username: 'driver_vijay', email: 'vijay@quickresponse.com', role: 'fleet_staff', firstName: 'Vijay', lastName: 'Patil' },
    ];

    const fleetUserIds = [];
    for (const user of fleetUsers) {
      const [result] = await db.query(
        `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fleetId, user.username, user.email, hashedPassword, user.role, user.firstName, user.lastName, USER_STATUS.ACTIVE]
      );
      fleetUserIds.push({ id: result.insertId, role: user.role, email: user.email });
      console.log(`  ✅ ${user.firstName} ${user.lastName} (${user.role})`);
    }

    // ============= HOSPITAL AMBULANCES =============
    console.log('🚑 Creating Hospital Ambulances...');
    const hospitalAmbulances = [
      { code: 'AMB-HOSP-001', regNo: 'MH-01-HA-1234', model: 'Tata Winger', type: 'ALS' },
      { code: 'AMB-HOSP-002', regNo: 'MH-01-HA-1235', model: 'Force Traveller', type: 'BLS' },
      { code: 'AMB-HOSP-003', regNo: 'MH-01-HA-1236', model: 'Mahindra Bolero', type: 'Patient Transport' },
    ];

    const hospitalAmbulanceIds = [];
    for (const ambulance of hospitalAmbulances) {
      const [result] = await db.query(
        `INSERT INTO ambulances (organization_id, ambulance_code, registration_number, vehicle_model, vehicle_type, status, approved_by, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [hospitalId, ambulance.code, ambulance.regNo, ambulance.model, ambulance.type, 'active', superadminResult.insertId, new Date()]
      );
      hospitalAmbulanceIds.push(result.insertId);
      console.log(`  ✅ ${ambulance.code} (${ambulance.type})`);
    }

    // ============= FLEET AMBULANCES =============
    console.log('🚛 Creating Fleet Ambulances...');
    const fleetAmbulances = [
      { code: 'AMB-FLEET-001', regNo: 'MH-01-FA-5678', model: 'Tata Winger', type: 'ALS' },
      { code: 'AMB-FLEET-002', regNo: 'MH-01-FA-5679', model: 'Force Traveller', type: 'BLS' },
      { code: 'AMB-FLEET-003', regNo: 'MH-01-FA-5680', model: 'Tempo Traveller', type: 'ICU' },
      { code: 'AMB-FLEET-004', regNo: 'MH-01-FA-5681', model: 'Mahindra Bolero', type: 'Patient Transport' },
    ];

    const fleetAmbulanceIds = [];
    for (const ambulance of fleetAmbulances) {
      const [result] = await db.query(
        `INSERT INTO ambulances (organization_id, ambulance_code, registration_number, vehicle_model, vehicle_type, status, approved_by, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fleetId, ambulance.code, ambulance.regNo, ambulance.model, ambulance.type, 'active', superadminResult.insertId, new Date()]
      );
      fleetAmbulanceIds.push(result.insertId);
      console.log(`  ✅ ${ambulance.code} (${ambulance.type})`);
    }

    // ============= AMBULANCE DEVICES =============
    console.log('📱 Creating Ambulance Devices...');
    const deviceTypes = ['CAMERA', 'LIVE_LOCATION', 'ECG', 'VITAL_MONITOR', 'GPS_TRACKER'];
    const deviceManufacturers = ['Hikvision', 'Garmin', 'Philips', 'GE Healthcare', 'Medtronic'];
    
    let deviceCount = 0;
    const allAmbulanceIds = [...hospitalAmbulanceIds, ...fleetAmbulanceIds];
    
    for (const ambulanceId of allAmbulanceIds) {
      // Each ambulance gets 2-3 random devices
      const numDevices = 2 + Math.floor(Math.random() * 2);
      const selectedTypes = [...deviceTypes].sort(() => 0.5 - Math.random()).slice(0, numDevices);
      
      for (let i = 0; i < selectedTypes.length; i++) {
        const deviceType = selectedTypes[i];
        const manufacturer = deviceManufacturers[Math.floor(Math.random() * deviceManufacturers.length)];
        const deviceId = `DEV-${ambulanceId}-${deviceType.substring(0, 3)}-${String(i + 1).padStart(3, '0')}`;
        const deviceName = `${deviceType.replace('_', ' ')} Device ${i + 1}`;
        const deviceApi = `https://api.device.com/v1/${deviceType.toLowerCase()}/${deviceId}`;
        
        await db.query(
          `INSERT INTO ambulance_devices (ambulance_id, device_name, device_type, device_id, device_password, device_api, manufacturer, model, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ambulanceId,
            deviceName,
            deviceType,
            deviceId,
            'Device@123',
            deviceApi,
            manufacturer,
            `Model-${deviceType}-${Math.floor(Math.random() * 1000)}`,
            'active'
          ]
        );
        deviceCount++;
      }
      console.log(`  ✅ Ambulance ${ambulanceId} - ${selectedTypes.length} devices`);
    }

    // ============= PATIENTS =============
    console.log('🏥 Creating Patients...');
    const patients = [
      { code: 'PAT-001', firstName: 'Ramesh', lastName: 'Sharma', age: 45, gender: 'male', blood: 'O+', phone: '+91-9876000001', complaint: 'Chest pain' },
      { code: 'PAT-002', firstName: 'Sunita', lastName: 'Patel', age: 32, gender: 'female', blood: 'A+', phone: '+91-9876000002', complaint: 'Road accident' },
      { code: 'PAT-003', firstName: 'Vijay', lastName: 'Kumar', age: 58, gender: 'male', blood: 'B+', phone: '+91-9876000003', complaint: 'Cardiac arrest' },
      { code: 'PAT-004', firstName: 'Anita', lastName: 'Desai', age: 28, gender: 'female', blood: 'AB+', phone: '+91-9876000004', complaint: 'Breathing difficulty' },
      { code: 'PAT-005', firstName: 'Suresh', lastName: 'Reddy', age: 67, gender: 'male', blood: 'O-', phone: '+91-9876000005', complaint: 'Stroke symptoms' },
      { code: 'PAT-006', firstName: 'Lakshmi', lastName: 'Nair', age: 41, gender: 'female', blood: 'A-', phone: '+91-9876000006', complaint: 'Severe bleeding' },
      { code: 'PAT-007', firstName: 'Mohan', lastName: 'Gupta', age: 53, gender: 'male', blood: 'B-', phone: '+91-9876000007', complaint: 'Seizure' },
    ];

    const patientIds = [];
    for (const patient of patients) {
      const [result] = await db.query(
        `INSERT INTO patients (patient_code, first_name, last_name, age, gender, blood_group, contact_phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [patient.code, patient.firstName, patient.lastName, patient.age, patient.gender, patient.blood, patient.phone, randomDate(new Date(2024, 0, 1), new Date())]
      );
      patientIds.push({ id: result.insertId, ...patient });
      console.log(`  ✅ ${patient.firstName} ${patient.lastName} (${patient.age}Y, ${patient.blood})`);
    }

    // ============= PATIENT SESSIONS (TRIPS) =============
    console.log('🚨 Creating Patient Sessions (Trips)...');
    const sessions = [
      { patientId: patientIds[0].id, ambulanceId: hospitalAmbulanceIds[0], status: 'in_transit', complaint: patients[0].complaint },
      { patientId: patientIds[1].id, ambulanceId: hospitalAmbulanceIds[1], status: 'offboarded', complaint: patients[1].complaint },
      { patientId: patientIds[2].id, ambulanceId: fleetAmbulanceIds[0], status: 'onboarded', complaint: patients[2].complaint },
      { patientId: patientIds[3].id, ambulanceId: fleetAmbulanceIds[1], status: 'in_transit', complaint: patients[3].complaint },
      { patientId: patientIds[4].id, ambulanceId: hospitalAmbulanceIds[2], status: 'offboarded', complaint: patients[4].complaint },
      { patientId: patientIds[5].id, ambulanceId: fleetAmbulanceIds[2], status: 'onboarded', complaint: patients[5].complaint },
      { patientId: patientIds[6].id, ambulanceId: fleetAmbulanceIds[3], status: 'in_transit', complaint: patients[6].complaint },
    ];

    for (const session of sessions) {
      const doctor = hospitalUserIds.find(u => u.role === 'hospital_doctor');
      const paramedic = [...hospitalUserIds, ...fleetUserIds].find(u => u.role.includes('paramedic'));
      const sessionCode = `TRIP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      
      const [result] = await db.query(
        `INSERT INTO patient_sessions (session_code, patient_id, ambulance_id, hospital_id, fleet_owner_id, assigned_doctor_id, assigned_paramedic_id, 
         status, chief_complaint, onboarded_by, onboarded_at, pickup_location, destination_location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sessionCode, session.patientId, session.ambulanceId, hospitalId, 
         session.ambulanceId === hospitalAmbulanceIds[0] || session.ambulanceId === hospitalAmbulanceIds[1] || session.ambulanceId === hospitalAmbulanceIds[2] ? null : fleetId,
         doctor?.id, paramedic?.id, session.status, session.complaint, doctor?.id || superadminResult.insertId, 
         randomDate(new Date(2024, 10, 1), new Date()), 'Emergency Pickup Location', 'Apollo Hospital Emergency Ward']
      );
      console.log(`  ✅ ${sessionCode} - Patient ${session.patientId} (${session.status})`);
    }

    // ============= COLLABORATION REQUESTS (APPROVALS) =============
    console.log('🤝 Creating Collaboration Requests...');
    const collaborations = [
      { hospitalId: hospitalId, fleetId: fleetId, ambulanceId: fleetAmbulanceIds[0], status: 'accepted', message: 'Need ALS ambulance for emergency cardiac cases' },
      { hospitalId: hospitalId, fleetId: fleetId, ambulanceId: fleetAmbulanceIds[1], status: 'pending', message: 'Request for BLS ambulance collaboration' },
      { hospitalId: hospitalId, fleetId: fleetId, ambulanceId: fleetAmbulanceIds[2], status: 'accepted', message: 'ICU ambulance for critical patient transport' },
      { hospitalId: hospitalId, fleetId: fleetId, ambulanceId: fleetAmbulanceIds[3], status: 'rejected', message: 'Patient transport ambulance request' },
    ];

    for (const collab of collaborations) {
      const requestedBy = hospitalUserIds.find(u => u.role === 'hospital_admin');
      const [result] = await db.query(
        `INSERT INTO collaboration_requests (hospital_id, fleet_owner_id, ambulance_id, status, requested_by, request_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [collab.hospitalId, collab.fleetId, collab.ambulanceId, collab.status, requestedBy?.id || superadminResult.insertId, collab.message, randomDate(new Date(2024, 0, 1), new Date())]
      );
      console.log(`  ✅ Hospital ↔ Fleet (${collab.status})`);
    }

    // ============= SUMMARY =============
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Comprehensive Database Seeding Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • 1 Superadmin`);
    console.log(`   • 1 Hospital (Apollo Hospitals)`);
    console.log(`   • 1 Fleet Owner (QuickResponse Fleet)`);
    console.log(`   • ${hospitalUsers.length} Hospital Users (1 admin, 2 doctors, 2 paramedics, 1 staff)`);
    console.log(`   • ${fleetUsers.length} Fleet Users (1 admin, 2 paramedics, 2 drivers)`);
    console.log(`   • ${hospitalAmbulances.length} Hospital Ambulances`);
    console.log(`   • ${fleetAmbulances.length} Fleet Ambulances`);
    console.log(`   • ${deviceCount} Ambulance Devices`);
    console.log(`   • ${patients.length} Patients`);
    console.log(`   • ${sessions.length} Active Trips`);
    console.log(`   • ${collaborations.length} Collaboration Requests\n`);
    console.log('🔑 Default Login Credentials:');
    console.log('   Password: Admin@123');
    console.log('\n   Examples:');
    console.log('   • superadmin@resculance.com (Superadmin)');
    console.log('   • admin@apollo.com (Hospital Admin)');
    console.log('   • admin@quickresponse.com (Fleet Admin)');
    console.log('   • dr.shah@apollo.com (Doctor)');
    console.log('   • raj.p@apollo.com (Paramedic)');
    console.log('   • para1@quickresponse.com (Fleet Paramedic)\n');
    console.log('⚠️  Please change passwords after first login!');
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Comprehensive seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedComprehensive();
}

module.exports = { seedComprehensive };

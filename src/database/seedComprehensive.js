require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { ROLES, ORG_TYPES, USER_STATUS } = require('../config/constants');

async function seedComprehensive() {
  try {
    console.log('Starting comprehensive database seeding...');

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // 1. Create Organizations
    console.log('\n📋 Creating Organizations...');
    
    // Get or create system org for superadmin
    const [existingSysOrg] = await db.query(`SELECT id FROM organizations WHERE code = 'SYS-001'`);
    let systemOrgId;
    if (existingSysOrg.length > 0) {
      systemOrgId = existingSysOrg[0].id;
      console.log('✅ System organization already exists');
    } else {
      const [sysOrg] = await db.query(
        `INSERT INTO organizations (name, code, type, address, city, state, postal_code, phone, email, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['System', 'SYS-001', ORG_TYPES.HOSPITAL, '123 Admin St', 'New York', 'NY', '10001', '1234567890', 'admin@system.com', 'active']
      );
      systemOrgId = sysOrg.insertId;
      console.log('✅ System organization created');
    }

    // Hospitals
    const hospitals = [
      ['City General Hospital', 'HOSP-001', '100 Main St', 'New York', 'NY', '10001', '2125551001', 'contact@citygeneral.com'],
      ['Memorial Medical Center', 'HOSP-002', '200 Park Ave', 'Los Angeles', 'CA', '90001', '3105552002', 'info@memorialmed.com'],
      ['St. Mary\'s Hospital', 'HOSP-003', '300 Oak Rd', 'Chicago', 'IL', '60601', '3125553003', 'admin@stmarys.com'],
      ['Riverside Health', 'HOSP-004', '400 River Dr', 'Houston', 'TX', '77001', '7135554004', 'contact@riverside.com'],
      ['Metro Hospital', 'HOSP-005', '500 Metro Blvd', 'Phoenix', 'AZ', '85001', '6025555005', 'info@metrohospital.com'],
      ['Central Medical', 'HOSP-006', '600 Central Ave', 'Philadelphia', 'PA', '19101', '2155556006', 'contact@centralmed.com'],
    ];

    const hospitalIds = [];
    for (const [name, code, address, city, state, postal, phone, email] of hospitals) {
      const [result] = await db.query(
        `INSERT INTO organizations (name, code, type, address, city, state, postal_code, phone, email, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, code, ORG_TYPES.HOSPITAL, address, city, state, postal, phone, email, 'active']
      );
      hospitalIds.push(result.insertId);
      console.log(`✅ ${name} created`);
    }

    // Fleet Owners
    const fleets = [
      ['Rapid Response Fleet', 'FLEET-001', '700 Fleet St', 'San Antonio', 'TX', '78201', '2105557001', 'dispatch@rapidresponse.com'],
      ['Emergency Transport Services', 'FLEET-002', '800 Transport Way', 'San Diego', 'CA', '92101', '6195558002', 'ops@etservices.com'],
      ['Metro Ambulance Corp', 'FLEET-003', '900 Ambulance Dr', 'Dallas', 'TX', '75201', '2145559003', 'admin@metroambulance.com'],
      ['LifeLine Fleet', 'FLEET-004', '1000 Life Ln', 'San Jose', 'CA', '95101', '4085550004', 'contact@lifelinefleet.com'],
    ];

    const fleetIds = [];
    for (const [name, code, address, city, state, postal, phone, email] of fleets) {
      const [result] = await db.query(
        `INSERT INTO organizations (name, code, type, address, city, state, postal_code, phone, email, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, code, ORG_TYPES.FLEET_OWNER, address, city, state, postal, phone, email, 'active']
      );
      fleetIds.push(result.insertId);
      console.log(`✅ ${name} created`);
    }

    // 2. Create Users
    console.log('\n👥 Creating Users...');

    // Check if superadmin exists
    const [existingSuperadmin] = await db.query(`SELECT id FROM users WHERE email = 'superadmin@resculance.com'`);
    if (existingSuperadmin.length === 0) {
      await db.query(
        `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, phone, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [systemOrgId, 'superadmin', 'superadmin@resculance.com', hashedPassword, ROLES.SUPERADMIN, 'Super', 'Admin', '1234567890', USER_STATUS.ACTIVE]
      );
      console.log('✅ Superadmin created');
    } else {
      console.log('✅ Superadmin already exists');
    }

    // Hospital Admins & Staff
    const hospitalUsers = [
      [hospitalIds[0], 'Hospital Admin', 'admin@citygeneral.com', ROLES.HOSPITAL_ADMIN, 'John', 'Smith', '2125551101'],
      [hospitalIds[0], 'Doctor', 'doctor1@citygeneral.com', ROLES.HOSPITAL_DOCTOR, 'Sarah', 'Johnson', '2125551102', 'MD12345', 'Emergency Medicine'],
      [hospitalIds[0], 'Doctor', 'doctor2@citygeneral.com', ROLES.HOSPITAL_DOCTOR, 'Michael', 'Brown', '2125551103', 'MD12346', 'Cardiology'],
      [hospitalIds[0], 'Paramedic', 'paramedic1@citygeneral.com', ROLES.HOSPITAL_PARAMEDIC, 'Emily', 'Davis', '2125551104', 'PM12345'],
      
      [hospitalIds[1], 'Hospital Admin', 'admin@memorialmed.com', ROLES.HOSPITAL_ADMIN, 'Robert', 'Wilson', '3105552101'],
      [hospitalIds[1], 'Doctor', 'doctor1@memorialmed.com', ROLES.HOSPITAL_DOCTOR, 'Lisa', 'Martinez', '3105552102', 'MD22345', 'Trauma Surgery'],
      [hospitalIds[1], 'Paramedic', 'paramedic1@memorialmed.com', ROLES.HOSPITAL_PARAMEDIC, 'David', 'Garcia', '3105552103', 'PM22345'],
      
      [hospitalIds[2], 'Hospital Admin', 'admin@stmarys.com', ROLES.HOSPITAL_ADMIN, 'Jennifer', 'Anderson', '3125553101'],
      [hospitalIds[2], 'Doctor', 'doctor1@stmarys.com', ROLES.HOSPITAL_DOCTOR, 'James', 'Taylor', '3125553102', 'MD32345', 'Internal Medicine'],
      [hospitalIds[2], 'Paramedic', 'paramedic1@stmarys.com', ROLES.HOSPITAL_PARAMEDIC, 'Maria', 'Rodriguez', '3125553103', 'PM32345'],
      
      [hospitalIds[3], 'Hospital Admin', 'admin@riverside.com', ROLES.HOSPITAL_ADMIN, 'William', 'Thomas', '7135554101'],
      [hospitalIds[3], 'Doctor', 'doctor1@riverside.com', ROLES.HOSPITAL_DOCTOR, 'Patricia', 'Lee', '7135554102', 'MD42345', 'Pediatrics'],
      
      [hospitalIds[4], 'Hospital Admin', 'admin@metrohospital.com', ROLES.HOSPITAL_ADMIN, 'Richard', 'White', '6025555101'],
      [hospitalIds[4], 'Paramedic', 'paramedic1@metrohospital.com', ROLES.HOSPITAL_PARAMEDIC, 'Linda', 'Harris', '6025555102', 'PM52345'],
      
      [hospitalIds[5], 'Hospital Admin', 'admin@centralmed.com', ROLES.HOSPITAL_ADMIN, 'Barbara', 'Clark', '2155556101'],
      [hospitalIds[5], 'Doctor', 'doctor1@centralmed.com', ROLES.HOSPITAL_DOCTOR, 'Thomas', 'Lewis', '2155556102', 'MD62345', 'Neurology'],
    ];

    for (const [orgId, username, email, role, firstName, lastName, phone, license, specialization] of hospitalUsers) {
      const user = username.toLowerCase().replace(/\s+/g, '_') + Math.random().toString(36).substr(2, 4);
      await db.query(
        `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, phone, license_number, specialization, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orgId, user, email, hashedPassword, role, firstName, lastName, phone, license || null, specialization || null, USER_STATUS.ACTIVE]
      );
      console.log(`✅ ${role} - ${firstName} ${lastName} created for ${hospitals.find((_, i) => hospitalIds[i] === orgId)?.[0] || 'Hospital'}`);
    }

    // Fleet Admins & Staff
    const fleetUsers = [
      [fleetIds[0], 'Fleet Admin', 'admin@rapidresponse.com', ROLES.FLEET_ADMIN, 'Charles', 'Walker', '2105557101'],
      [fleetIds[0], 'Paramedic', 'paramedic1@rapidresponse.com', ROLES.FLEET_PARAMEDIC, 'Nancy', 'Hall', '2105557102', 'PM72345'],
      [fleetIds[0], 'Staff', 'staff1@rapidresponse.com', ROLES.FLEET_STAFF, 'Kevin', 'Allen', '2105557103', 'DL72345'],
      [fleetIds[0], 'Staff', 'staff2@rapidresponse.com', ROLES.FLEET_STAFF, 'Karen', 'Young', '2105557104', 'DL72346'],
      
      [fleetIds[1], 'Fleet Admin', 'admin@etservices.com', ROLES.FLEET_ADMIN, 'Steven', 'King', '6195558101'],
      [fleetIds[1], 'Paramedic', 'paramedic1@etservices.com', ROLES.FLEET_PARAMEDIC, 'Betty', 'Wright', '6195558102', 'PM82345'],
      [fleetIds[1], 'Staff', 'staff1@etservices.com', ROLES.FLEET_STAFF, 'Edward', 'Lopez', '6195558103', 'DL82345'],
      
      [fleetIds[2], 'Fleet Admin', 'admin@metroambulance.com', ROLES.FLEET_ADMIN, 'Dorothy', 'Hill', '2145559101'],
      [fleetIds[2], 'Paramedic', 'paramedic1@metroambulance.com', ROLES.FLEET_PARAMEDIC, 'Jason', 'Scott', '2145559102', 'PM92345'],
      [fleetIds[2], 'Staff', 'staff1@metroambulance.com', ROLES.FLEET_STAFF, 'Sandra', 'Green', '2145559103', 'DL92345'],
      
      [fleetIds[3], 'Fleet Admin', 'admin@lifelinefleet.com', ROLES.FLEET_ADMIN, 'Matthew', 'Adams', '4085550101'],
      [fleetIds[3], 'Paramedic', 'paramedic1@lifelinefleet.com', ROLES.FLEET_PARAMEDIC, 'Ashley', 'Baker', '4085550102', 'PM02345'],
      [fleetIds[3], 'Staff', 'staff1@lifelinefleet.com', ROLES.FLEET_STAFF, 'Joshua', 'Nelson', '4085550103', 'DL02345'],
    ];

    for (const [orgId, username, email, role, firstName, lastName, phone, license] of fleetUsers) {
      const user = username.toLowerCase().replace(/\s+/g, '_') + Math.random().toString(36).substr(2, 4);
      await db.query(
        `INSERT INTO users (organization_id, username, email, password, role, first_name, last_name, phone, license_number, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orgId, user, email, hashedPassword, role, firstName, lastName, phone, license || null, USER_STATUS.ACTIVE]
      );
      console.log(`✅ ${role} - ${firstName} ${lastName} created for ${fleets.find((_, i) => fleetIds[i] === orgId)?.[0] || 'Fleet'}`);
    }

    // 3. Create Ambulances
    console.log('\n🚑 Creating Ambulances...');

    const ambulances = [
      [fleetIds[0], 'AMB-RF-001', 'NY-1234', 'Ford Transit', 'BLS', 'active'],
      [fleetIds[0], 'AMB-RF-002', 'NY-1235', 'Mercedes Sprinter', 'ALS', 'active'],
      [fleetIds[0], 'AMB-RF-003', 'NY-1236', 'Chevrolet Express', 'BLS', 'active'],
      [fleetIds[0], 'AMB-RF-004', 'NY-1237', 'Ford Transit', 'SCU', 'active'],
      
      [fleetIds[1], 'AMB-ETS-001', 'CA-2234', 'Mercedes Sprinter', 'ALS', 'active'],
      [fleetIds[1], 'AMB-ETS-002', 'CA-2235', 'Ford Transit', 'BLS', 'active'],
      [fleetIds[1], 'AMB-ETS-003', 'CA-2236', 'Chevrolet Express', 'ALS', 'active'],
      
      [fleetIds[2], 'AMB-MAC-001', 'TX-3234', 'Ford Transit', 'BLS', 'active'],
      [fleetIds[2], 'AMB-MAC-002', 'TX-3235', 'Mercedes Sprinter', 'ALS', 'active'],
      [fleetIds[2], 'AMB-MAC-003', 'TX-3236', 'Ford Transit', 'SCU', 'active'],
      
      [fleetIds[3], 'AMB-LL-001', 'CA-4234', 'Mercedes Sprinter', 'ALS', 'active'],
      [fleetIds[3], 'AMB-LL-002', 'CA-4235', 'Chevrolet Express', 'BLS', 'active'],
      [fleetIds[3], 'AMB-LL-003', 'CA-4236', 'Ford Transit', 'ALS', 'active'],
      [fleetIds[3], 'AMB-LL-004', 'CA-4237', 'Mercedes Sprinter', 'BLS', 'active'],
    ];

    const ambulanceIds = [];
    for (const [orgId, code, regNum, model, type, status] of ambulances) {
      const [result] = await db.query(
        `INSERT INTO ambulances (organization_id, ambulance_code, registration_number, vehicle_model, vehicle_type, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orgId, code, regNum, model, type, status]
      );
      ambulanceIds.push(result.insertId);
      console.log(`✅ ${code} - ${regNum} created`);
    }

    // 4. Create Patients
    console.log('\n🏥 Creating Patients...');

    const patients = [
      ['John', 'Doe', 45, 'Male', '1234567890', 'O+', '123 Patient St, New York, NY 10001'],
      ['Jane', 'Smith', 50, 'Female', '1234567891', 'A+', '456 Care Ave, Los Angeles, CA 90001'],
      ['Robert', 'Johnson', 34, 'Male', '1234567892', 'B+', '789 Health Rd, Chicago, IL 60601'],
      ['Mary', 'Williams', 40, 'Female', '1234567893', 'AB+', '321 Med Blvd, Houston, TX 77001'],
      ['James', 'Brown', 55, 'Male', '1234567894', 'O-', '654 Hospital Dr, Phoenix, AZ 85001'],
      ['Patricia', 'Jones', 30, 'Female', '1234567895', 'A-', '987 Emergency Ln, Philadelphia, PA 19101'],
      ['Michael', 'Garcia', 37, 'Male', '1234567896', 'B-', '147 Urgent Way, San Antonio, TX 78201'],
      ['Linda', 'Martinez', 33, 'Female', '1234567897', 'AB-', '258 Crisis St, San Diego, CA 92101'],
      ['David', 'Rodriguez', 41, 'Male', '1234567898', 'O+', '369 Trauma Ave, Dallas, TX 75201'],
      ['Barbara', 'Hernandez', 47, 'Female', '1234567899', 'A+', '741 Rescue Rd, San Jose, CA 95101'],
    ];

    const patientIds = [];
    for (const [firstName, lastName, age, gender, phone, bloodGroup, address] of patients) {
      const patientCode = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const [result] = await db.query(
        `INSERT INTO patients (patient_code, first_name, last_name, age, gender, contact_phone, blood_group, address) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientCode, firstName, lastName, age, gender, phone, bloodGroup, address]
      );
      patientIds.push(result.insertId);
      console.log(`✅ Patient: ${firstName} ${lastName} - ${patientCode}`);
    }

    // 5. Create Patient Sessions (Trips)
    console.log('\n🚨 Creating Patient Sessions (Trips)...');

    const sessions = [
      [patientIds[0], ambulanceIds[2], hospitalIds[0], 'onboarded', '2024-10-30 08:30:00', null],
      [patientIds[1], ambulanceIds[5], hospitalIds[1], 'in_transit', '2024-10-30 09:15:00', null],
      [patientIds[2], ambulanceIds[9], hospitalIds[2], 'completed', '2024-10-29 14:20:00', '2024-10-29 15:45:00'],
      [patientIds[3], ambulanceIds[12], hospitalIds[3], 'completed', '2024-10-29 10:00:00', '2024-10-29 11:30:00'],
      [patientIds[4], ambulanceIds[0], hospitalIds[4], 'completed', '2024-10-28 16:45:00', '2024-10-28 18:10:00'],
      [patientIds[5], ambulanceIds[1], hospitalIds[5], 'completed', '2024-10-28 11:20:00', '2024-10-28 12:50:00'],
      [patientIds[6], ambulanceIds[3], hospitalIds[0], 'completed', '2024-10-27 07:30:00', '2024-10-27 09:00:00'],
    ];

    for (const [patientId, ambulanceId, hospitalId, status, onboardTime, offboardTime] of sessions) {
      await db.query(
        `INSERT INTO patient_sessions (patient_id, ambulance_id, hospital_id, status, onboard_time, offboard_time) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [patientId, ambulanceId, hospitalId, status, onboardTime, offboardTime]
      );
      console.log(`✅ Session created: Patient ${patientId} -> Hospital ${hospitalId} (${status})`);
    }

    // 6. Create Collaboration Requests
    console.log('\n🤝 Creating Collaboration Requests...');

    const collaborations = [
      [hospitalIds[0], fleetIds[0], 'accepted', 'Long-term partnership for emergency services'],
      [hospitalIds[1], fleetIds[1], 'accepted', '24/7 ambulance service coverage'],
      [hospitalIds[2], fleetIds[2], 'pending', 'New partnership proposal for trauma cases'],
      [hospitalIds[3], fleetIds[3], 'accepted', 'Specialized transport services'],
      [hospitalIds[4], fleetIds[0], 'pending', 'Additional coverage for weekends'],
      [hospitalIds[5], fleetIds[1], 'rejected', 'Terms not agreed upon'],
    ];

    for (const [hospitalId, fleetId, status, notes] of collaborations) {
      await db.query(
        `INSERT INTO collaboration_requests (hospital_id, fleet_owner_id, status, notes) 
         VALUES (?, ?, ?, ?)`,
        [hospitalId, fleetId, status, notes]
      );
      console.log(`✅ Collaboration: Hospital ${hospitalId} <-> Fleet ${fleetId} (${status})`);
    }

    console.log('\n✅ Comprehensive database seeding completed successfully!');
    console.log('\n🔑 Login Credentials (password for all: Admin@123):');
    console.log('   Superadmin: superadmin@resculance.com');
    console.log('   Hospital Admin: admin@citygeneral.com');
    console.log('   Fleet Admin: admin@rapidresponse.com');
    console.log('   Doctor: doctor1@citygeneral.com');
    console.log('   Paramedic: paramedic1@citygeneral.com');
    console.log('   Driver: driver1@rapidresponse.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedComprehensive();
}

module.exports = { seedComprehensive };

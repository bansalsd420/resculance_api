require('dotenv').config();
const db = require('../config/database');

async function seedPatients() {
  try {
    console.log('Adding patients and sessions...');

    // Get ambulance and hospital IDs
    const [ambulances] = await db.query('SELECT id FROM ambulances ORDER BY id LIMIT 14');
    const [hospitals] = await db.query('SELECT id FROM organizations WHERE type = "hospital" AND code != "SYS-001" ORDER BY id');

    const ambulanceIds = ambulances.map(a => a.id);
    const hospitalIds = hospitals.map(h => h.id);

    // Create Patients
    console.log('\n🏥 Creating Patients...');

    const patients = [
      ['John', 'Doe', '1980-05-15', 'male', '1234567890', 'john.doe@email.com', 'O+', '123 Patient St, New York, NY 10001', 'Jane Doe', '1234567899', 'Wife'],
      ['Jane', 'Smith', '1975-08-22', 'female', '1234567891', 'jane.smith@email.com', 'A+', '456 Care Ave, Los Angeles, CA 90001', 'John Smith', '1234567898', 'Husband'],
      ['Robert', 'Johnson', '1990-03-10', 'male', '1234567892', 'robert.j@email.com', 'B+', '789 Health Rd, Chicago, IL 60601', 'Mary Johnson', '1234567897', 'Mother'],
      ['Mary', 'Williams', '1985-11-30', 'female', '1234567893', 'mary.w@email.com', 'AB+', '321 Med Blvd, Houston, TX 77001', 'Robert Williams', '1234567896', 'Brother'],
      ['James', 'Brown', '1970-07-18', 'male', '1234567894', 'james.b@email.com', 'O-', '654 Hospital Dr, Phoenix, AZ 85001', 'Linda Brown', '1234567895', 'Wife'],
      ['Patricia', 'Jones', '1995-02-25', 'female', '1234567895', 'patricia.j@email.com', 'A-', '987 Emergency Ln, Philadelphia, PA 19101', 'William Jones', '1234567894', 'Father'],
      ['Michael', 'Garcia', '1988-09-12', 'male', '1234567896', 'michael.g@email.com', 'B-', '147 Urgent Way, San Antonio, TX 78201', 'Susan Garcia', '1234567893', 'Sister'],
      ['Linda', 'Martinez', '1992-04-08', 'female', '1234567897', 'linda.m@email.com', 'AB-', '258 Crisis St, San Diego, CA 92101', 'Carlos Martinez', '1234567892', 'Husband'],
      ['David', 'Rodriguez', '1983-12-20', 'male', '1234567898', 'david.r@email.com', 'O+', '369 Trauma Ave, Dallas, TX 75201', 'Maria Rodriguez', '1234567891', 'Wife'],
      ['Barbara', 'Hernandez', '1978-06-14', 'female', '1234567899', 'barbara.h@email.com', 'A+', '741 Rescue Rd, San Jose, CA 95101', 'Jose Hernandez', '1234567890', 'Husband'],
    ];

    const patientIds = [];
    for (const [firstName, lastName, dob, gender, phone, email, bloodGroup, address, emergencyName, emergencyPhone, emergencyRelation] of patients) {
      const patientCode = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const age = new Date().getFullYear() - new Date(dob).getFullYear();
      const [result] = await db.query(
        `INSERT INTO patients (patient_code, first_name, last_name, date_of_birth, age, gender, contact_phone, email, blood_group, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relation) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientCode, firstName, lastName, dob, age, gender, phone, email, bloodGroup, address, emergencyName, emergencyPhone, emergencyRelation]
      );
      patientIds.push(result.insertId);
      console.log(`✅ Patient: ${firstName} ${lastName} - ${patientCode}`);
    }

    // Create Patient Sessions (Trips)
    console.log('\n🚨 Creating Patient Sessions (Trips)...');

    const sessions = [
      [patientIds[0], ambulanceIds[2], hospitalIds[0], 'onboarded', '2024-10-30 08:30:00', '2024-10-30 08:30:00', null],
      [patientIds[1], ambulanceIds[5], hospitalIds[1], 'in_transit', '2024-10-30 09:15:00', '2024-10-30 09:15:00', null],
      [patientIds[2], ambulanceIds[9], hospitalIds[2], 'offboarded', '2024-10-29 14:20:00', '2024-10-29 14:20:00', '2024-10-29 15:45:00'],
      [patientIds[3], ambulanceIds[12], hospitalIds[3], 'offboarded', '2024-10-29 10:00:00', '2024-10-29 10:00:00', '2024-10-29 11:30:00'],
      [patientIds[4], ambulanceIds[0], hospitalIds[4], 'offboarded', '2024-10-28 16:45:00', '2024-10-28 16:45:00', '2024-10-28 18:10:00'],
      [patientIds[5], ambulanceIds[1], hospitalIds[5], 'offboarded', '2024-10-28 11:20:00', '2024-10-28 11:20:00', '2024-10-28 12:50:00'],
      [patientIds[6], ambulanceIds[3], hospitalIds[0], 'offboarded', '2024-10-27 07:30:00', '2024-10-27 07:30:00', '2024-10-27 09:00:00'],
    ];

    const [users] = await db.query('SELECT id FROM users WHERE role IN ("hospital_admin", "hospital_doctor") LIMIT 1');
    const onboardedBy = users[0]?.id || 1;

    for (const [patientId, ambulanceId, hospitalId, status, onboardedAt, onboardTime, offboardTime] of sessions) {
      const sessionCode = `SES-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await db.query(
        `INSERT INTO patient_sessions (session_code, patient_id, ambulance_id, hospital_id, status, onboarded_by, onboarded_at, onboard_time, offboard_time) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sessionCode, patientId, ambulanceId, hospitalId, status, onboardedBy, onboardedAt, onboardTime, offboardTime]
      );
      console.log(`✅ Session created: Patient ${patientId} -> Hospital ${hospitalId} (${status})`);
    }

    // Create Collaboration Requests
    console.log('\n🤝 Creating Collaboration Requests...');

    const collaborations = [
      [hospitalIds[0], hospitalIds.length > 0 ? await getFleetId(0) : null, 'accepted', 'Long-term partnership for emergency services'],
      [hospitalIds[1], hospitalIds.length > 1 ? await getFleetId(1) : null, 'accepted', '24/7 ambulance service coverage'],
      [hospitalIds[2], hospitalIds.length > 2 ? await getFleetId(2) : null, 'pending', 'New partnership proposal for trauma cases'],
      [hospitalIds[3], hospitalIds.length > 3 ? await getFleetId(3) : null, 'accepted', 'Specialized transport services'],
      [hospitalIds[4], hospitalIds.length > 4 ? await getFleetId(0) : null, 'pending', 'Additional coverage for weekends'],
      [hospitalIds[5], hospitalIds.length > 5 ? await getFleetId(1) : null, 'rejected', 'Terms not agreed upon'],
    ];

    async function getFleetId(index) {
      const [fleets] = await db.query('SELECT id FROM organizations WHERE type = "fleet_owner" ORDER BY id');
      return fleets[index]?.id || fleets[0]?.id;
    }

    for (const [hospitalId, fleetId, status, notes] of collaborations) {
      if (fleetId) {
        await db.query(
          `INSERT INTO collaboration_requests (hospital_id, fleet_owner_id, status, notes) 
           VALUES (?, ?, ?, ?)`,
          [hospitalId, fleetId, status, notes]
        );
        console.log(`✅ Collaboration: Hospital ${hospitalId} <-> Fleet ${fleetId} (${status})`);
      }
    }

    console.log('\n✅ Patients and sessions seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedPatients();
}

module.exports = { seedPatients };

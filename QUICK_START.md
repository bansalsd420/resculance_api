# RESCULANCE API - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Configure Database
1. Open MySQL and create database:
```sql
CREATE DATABASE resculance_db;
```

2. Edit `.env` file with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=resculance_db
```

### Step 3: Setup Database
```powershell
npm run migrate
npm run seed
```

### Step 4: Start Server
```powershell
npm run dev
```

Server will start at: http://localhost:5000

---

## 📝 Testing the API

### 1. Login as Superadmin

**Request:**
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "superadmin@resculance.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "superadmin",
      "email": "superadmin@resculance.com",
      "role": "superadmin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Save the `accessToken` for subsequent requests!

---

### 2. Create a Hospital

**Request:**
```http
POST http://localhost:5000/api/v1/organizations
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "City General Hospital",
  "code": "CGH-001",
  "type": "hospital",
  "address": "123 Medical Center Drive",
  "contactPerson": "Dr. John Smith",
  "contactEmail": "admin@cityhospital.com",
  "contactPhone": "+1234567890"
}
```

---

### 3. Create a Fleet Owner

**Request:**
```http
POST http://localhost:5000/api/v1/organizations
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "Emergency Fleet Services",
  "code": "EFS-001",
  "type": "fleet_owner",
  "address": "456 Fleet Street",
  "contactPerson": "Mike Johnson",
  "contactEmail": "admin@emergencyfleet.com",
  "contactPhone": "+1234567891"
}
```

---

### 4. Create Hospital Admin

**Request:**
```http
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "username": "hospital_admin_cgh",
  "email": "admin@cityhospital.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Smith",
  "role": "hospital_admin",
  "phone": "+1234567890",
  "organizationId": 2
}
```

---

### 5. Approve User (Superadmin)

**Request:**
```http
PATCH http://localhost:5000/api/v1/users/2/approve
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

### 6. Create Ambulance

**Request:**
```http
POST http://localhost:5000/api/v1/ambulances
Content-Type: application/json
Authorization: Bearer HOSPITAL_ADMIN_TOKEN

{
  "ambulanceCode": "AMB-CGH-001",
  "registrationNumber": "EMG-12345",
  "vehicleModel": "Mercedes Sprinter",
  "vehicleType": "Advanced Life Support"
}
```

---

### 7. Approve Ambulance (Superadmin)

**Request:**
```http
PATCH http://localhost:5000/api/v1/ambulances/1/approve
Authorization: Bearer SUPERADMIN_TOKEN
```

---

### 8. Create Doctor

**Request:**
```http
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer HOSPITAL_ADMIN_TOKEN

{
  "username": "dr_jane_doe",
  "email": "jane.doe@cityhospital.com",
  "password": "DoctorPass123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "hospital_doctor",
  "phone": "+1234567892",
  "organizationId": 2
}
```

---

### 9. Create Paramedic

**Request:**
```http
POST http://localhost:5000/api/v1/users
Content-Type: application/json
Authorization: Bearer HOSPITAL_ADMIN_TOKEN

{
  "username": "paramedic_tom",
  "email": "tom@cityhospital.com",
  "password": "ParamedicPass123",
  "firstName": "Tom",
  "lastName": "Wilson",
  "role": "hospital_paramedic",
  "phone": "+1234567893",
  "organizationId": 2
}
```

---

### 10. Assign Doctor & Paramedic to Ambulance

**Assign Doctor:**
```http
POST http://localhost:5000/api/v1/ambulances/1/assign-user
Content-Type: application/json
Authorization: Bearer HOSPITAL_ADMIN_TOKEN

{
  "userId": 3
}
```

**Assign Paramedic:**
```http
POST http://localhost:5000/api/v1/ambulances/1/assign-user
Content-Type: application/json
Authorization: Bearer HOSPITAL_ADMIN_TOKEN

{
  "userId": 4
}
```

---

### 11. Create Patient

**Request:**
```http
POST http://localhost:5000/api/v1/patients
Content-Type: application/json
Authorization: Bearer PARAMEDIC_TOKEN

{
  "firstName": "Alice",
  "lastName": "Johnson",
  "age": 45,
  "gender": "female",
  "bloodGroup": "O+",
  "contactPhone": "+1234567894",
  "emergencyContactName": "Bob Johnson",
  "emergencyContactPhone": "+1234567895",
  "address": "789 Residential Ave",
  "medicalHistory": "Hypertension, Diabetes Type 2",
  "allergies": "Penicillin",
  "currentMedications": "Metformin, Lisinopril"
}
```

---

### 12. Onboard Patient to Ambulance

**Request:**
```http
POST http://localhost:5000/api/v1/patients/onboard
Content-Type: application/json
Authorization: Bearer PARAMEDIC_TOKEN

{
  "patientId": 1,
  "ambulanceId": 1,
  "assignedDoctorId": 3,
  "assignedParamedicId": 4,
  "pickupLocation": "789 Residential Ave",
  "pickupLat": 40.7128,
  "pickupLng": -74.0060,
  "destinationLocation": "City General Hospital",
  "destinationLat": 40.7580,
  "destinationLng": -73.9855,
  "chiefComplaint": "Chest pain and shortness of breath",
  "initialAssessment": "Patient conscious, BP elevated, possible cardiac event"
}
```

---

### 13. Add Vital Signs During Transport

**Request:**
```http
POST http://localhost:5000/api/v1/patients/sessions/1/vitals
Content-Type: application/json
Authorization: Bearer PARAMEDIC_TOKEN

{
  "heartRate": 95,
  "bloodPressureSystolic": 160,
  "bloodPressureDiastolic": 95,
  "oxygenSaturation": 92,
  "temperature": 37.2,
  "respiratoryRate": 22
}
```

---

### 14. Update Ambulance Location

**Request:**
```http
PATCH http://localhost:5000/api/v1/ambulances/1/location
Content-Type: application/json
Authorization: Bearer PARAMEDIC_TOKEN

{
  "latitude": 40.7489,
  "longitude": -73.9680
}
```

---

### 15. Send Message (Doctor to Paramedic)

**Request:**
```http
POST http://localhost:5000/api/v1/patients/sessions/1/communications
Content-Type: application/json
Authorization: Bearer DOCTOR_TOKEN

{
  "receiverId": 4,
  "communicationType": "text",
  "message": "Please administer oxygen and monitor vital signs every 2 minutes"
}
```

---

### 16. Offboard Patient

**Request:**
```http
PATCH http://localhost:5000/api/v1/patients/sessions/1/offboard
Content-Type: application/json
Authorization: Bearer PARAMEDIC_TOKEN

{
  "treatmentNotes": "Patient transported successfully. Vitals stabilized. Handed over to ER team at 14:35."
}
```

---

## 🔌 WebSocket Testing

### Connect to Socket.IO

**JavaScript Example:**
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Join ambulance room
socket.emit('join_ambulance', { ambulanceId: 1 });

// Listen for vital updates
socket.on('vital_update', (data) => {
  console.log('New vital signs:', data);
});

// Listen for location updates
socket.on('location_update', (data) => {
  console.log('Ambulance location:', data);
});

// Send message
socket.emit('message', {
  sessionId: 1,
  message: 'Patient is stable',
  receiverId: 3
});

// Listen for messages
socket.on('message', (data) => {
  console.log('New message:', data);
});
```

---

## 🏥 Common Workflows

### Workflow 1: Hospital Uses Own Ambulance
1. Superadmin creates Hospital
2. Hospital Admin creates Ambulance
3. Superadmin approves Ambulance
4. Hospital Admin creates Doctor & Paramedic
5. Hospital Admin assigns them to Ambulance
6. Paramedic onboards Patient
7. Real-time monitoring via Socket.IO
8. Paramedic offboards Patient

### Workflow 2: Hospital Uses Fleet Ambulance
1. Superadmin creates Hospital & Fleet Owner
2. Fleet Owner creates Ambulance
3. Superadmin approves Ambulance
4. Hospital requests collaboration (with ambulance code + fleet code)
5. Fleet Owner accepts request
6. Hospital can now use the ambulance
7. Follow same onboarding process

### Workflow 3: Doctor-Paramedic Communication
1. Patient onboarded to ambulance
2. Doctor joins session via Socket.IO
3. Paramedic sends vital signs in real-time
4. Doctor sends instructions via text/call/video
5. Continuous monitoring until offboarding

---

## 🎯 Testing Checklist

- [ ] Login as Superadmin
- [ ] Create Hospital & Fleet Owner
- [ ] Create Hospital Admin user
- [ ] Approve Hospital Admin
- [ ] Login as Hospital Admin
- [ ] Create Ambulance
- [ ] Approve Ambulance (as Superadmin)
- [ ] Create Doctor & Paramedic
- [ ] Assign users to Ambulance
- [ ] Create Patient
- [ ] Onboard Patient
- [ ] Add Vital Signs
- [ ] Update Location
- [ ] Send Communication
- [ ] Offboard Patient
- [ ] Test Socket.IO real-time updates
- [ ] Test Collaboration Request flow

---

## 🐛 Common Issues

**Issue: Database connection failed**
- Solution: Check MySQL is running and credentials in `.env` are correct

**Issue: Token expired**
- Solution: Use refresh token endpoint or login again

**Issue: Permission denied**
- Solution: Verify user role has required permissions for the action

**Issue: Ambulance not available**
- Solution: Check ambulance status is 'active' and approved by Superadmin

**Issue: Socket.IO not connecting**
- Solution: Ensure JWT token is provided in auth field

---

## 📞 Need Help?

- Review the main README.md for detailed documentation
- Check API response error messages for guidance
- Verify request body matches validation rules
- Ensure proper authentication headers are included

Happy coding! 🚀

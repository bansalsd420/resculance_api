# 🔥 POSTMAN Testing Guide - RESCULANCE API

Complete guide for testing all RESCULANCE API endpoints using Postman.

---

## 📥 Quick Setup

### 1. Import Collection
1. Open **Postman**
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `RESCULANCE_API.postman_collection.json`
5. Click **Import**

### 2. Configure Environment (Optional but Recommended)

Create a new environment with these variables:
- `baseUrl`: `http://localhost:5000/api/v1`
- `accessToken`: (will be auto-filled after login)
- `refreshToken`: (will be auto-filled after login)
- `userId`: (will be auto-filled)
- `organizationId`: (will be auto-filled)
- `ambulanceId`: (will be auto-filled)
- `patientId`: (will be auto-filled)
- `sessionId`: (will be auto-filled)

**Or simply use collection variables** (already configured in the collection).

---

## 🚀 Testing Workflow

### Step 1: Health Check
**Endpoint:** `GET /health`
**Auth:** None

Test if server is running:
```
GET http://localhost:5000/health
```

**Expected Response (200):**
```json
{
  "status": "success",
  "message": "RESCULANCE API is running",
  "timestamp": "2025-10-30T..."
}
```

---

### Step 2: Login as Superadmin
**Endpoint:** `POST /api/v1/auth/login`
**Auth:** None

**Request Body:**
```json
{
  "email": "superadmin@resculance.com",
  "password": "Admin@123"
}
```

**Expected Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "superadmin@resculance.com",
      "role": "SUPERADMIN",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✨ Auto-Scripts:** The collection automatically saves `accessToken`, `refreshToken`, and `userId` to variables!

---

### Step 3: Create Hospital Organization
**Endpoint:** `POST /api/v1/organizations`
**Auth:** Bearer Token (automatic)

**Request Body:**
```json
{
  "name": "City General Hospital",
  "type": "HOSPITAL",
  "address": "123 Medical Center Drive",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "phone": "+1234567890",
  "email": "contact@cityhospital.com",
  "licenseNumber": "HOSP-2025-001"
}
```

**Expected Response (201):**
```json
{
  "status": "success",
  "message": "Organization created successfully",
  "data": {
    "id": 2,
    "name": "City General Hospital",
    "code": "HOSP-001",
    "type": "HOSPITAL",
    ...
  }
}
```

**✨ Auto-Scripts:** `organizationId` is automatically saved!

---

### Step 4: Create Fleet Owner Organization
**Endpoint:** `POST /api/v1/organizations`

**Request Body:**
```json
{
  "name": "Quick Response Ambulance Services",
  "type": "FLEET_OWNER",
  "address": "456 Fleet Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10002",
  "country": "USA",
  "phone": "+1987654321",
  "email": "contact@quickresponse.com",
  "licenseNumber": "FLEET-2025-001"
}
```

---

### Step 5: Create Doctor User
**Endpoint:** `POST /api/v1/users`

**Request Body:**
```json
{
  "email": "doctor.john@hospital.com",
  "password": "Doctor@123",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567891",
  "role": "DOCTOR",
  "organizationId": 2,
  "licenseNumber": "DOC-12345",
  "specialization": "Emergency Medicine"
}
```

**Expected Response (201):**
```json
{
  "status": "success",
  "message": "User created successfully. Awaiting approval.",
  "data": {
    "id": 2,
    "status": "pending",
    ...
  }
}
```

---

### Step 6: Approve User
**Endpoint:** `POST /api/v1/users/:userId/approve`

**URL:** `POST /api/v1/users/2/approve`

**Expected Response (200):**
```json
{
  "status": "success",
  "message": "User approved successfully"
}
```

---

### Step 7: Create Ambulance
**Endpoint:** `POST /api/v1/ambulances`

**Note:** Login as Fleet Admin first!

**Request Body:**
```json
{
  "vehicleNumber": "AMB-2025-001",
  "vehicleModel": "Mercedes Sprinter",
  "vehicleType": "BLS",
  "deviceId": "DEV-001",
  "status": "available",
  "organizationId": 3
}
```

**Expected Response (201):**
```json
{
  "status": "success",
  "message": "Ambulance created successfully",
  "data": {
    "id": 1,
    "vehicleNumber": "AMB-2025-001",
    ...
  }
}
```

---

### Step 8: Create Patient
**Endpoint:** `POST /api/v1/patients`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1985-05-15",
  "gender": "female",
  "bloodGroup": "O+",
  "phone": "+1234567893",
  "email": "jane.doe@email.com",
  "address": "789 Patient Street",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+1234567894",
  "emergencyContactRelation": "Spouse",
  "medicalHistory": "Hypertension, Diabetes",
  "allergies": "Penicillin",
  "currentMedications": "Metformin, Lisinopril"
}
```

---

### Step 9: Onboard Patient to Ambulance
**Endpoint:** `POST /api/v1/patients/:patientId/onboard`

**Request Body:**
```json
{
  "ambulanceId": 1,
  "pickupLocation": "123 Emergency Ave",
  "pickupLatitude": 40.7128,
  "pickupLongitude": -74.0060,
  "destinationHospitalId": 2,
  "chiefComplaint": "Chest pain, difficulty breathing",
  "initialAssessment": "Patient conscious, BP 140/90, HR 95"
}
```

**Expected Response (201):**
```json
{
  "status": "success",
  "message": "Patient onboarded successfully",
  "data": {
    "id": 1,
    "sessionId": "SESSION-001",
    ...
  }
}
```

---

### Step 10: Add Vital Signs
**Endpoint:** `POST /api/v1/patients/:patientId/vital-signs`

**Request Body:**
```json
{
  "heartRate": 85,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "oxygenSaturation": 98,
  "temperature": 98.6,
  "respiratoryRate": 16,
  "glucoseLevel": 105,
  "notes": "Patient stable, vitals normal"
}
```

---

### Step 11: Update Ambulance Location
**Endpoint:** `POST /api/v1/ambulances/:ambulanceId/location`

**Request Body:**
```json
{
  "latitude": 40.7589,
  "longitude": -73.9851
}
```

---

### Step 12: Create Collaboration Request
**Endpoint:** `POST /api/v1/collaboration/requests`

**Note:** Login as Hospital Admin

**Request Body:**
```json
{
  "fleetOwnerId": 3,
  "message": "We need ambulance support for our emergency department.",
  "requestType": "long-term",
  "startDate": "2025-11-01",
  "endDate": "2025-12-31"
}
```

---

## 🔐 Authentication Guide

### Using Bearer Token
All authenticated endpoints automatically use the `{{accessToken}}` variable from collection.

**Manual Setup:**
1. Login using `/auth/login`
2. Copy `accessToken` from response
3. Go to collection **Authorization** tab
4. Type: **Bearer Token**
5. Token: Paste the access token

**Automatic (Recommended):**
- Collection pre-request scripts automatically use `{{accessToken}}`
- Test scripts automatically save tokens after login

---

### Token Refresh
When access token expires (24 hours):

**Endpoint:** `POST /api/v1/auth/refresh`
**Request Body:**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**✨ Auto-Scripts:** New access token is automatically saved!

---

## 📋 Complete Testing Checklist

### ✅ Authentication Endpoints
- [ ] `POST /auth/login` - Login
- [ ] `POST /auth/register` - Register user
- [ ] `GET /auth/profile` - Get profile
- [ ] `PUT /auth/profile` - Update profile
- [ ] `POST /auth/change-password` - Change password
- [ ] `POST /auth/refresh` - Refresh token

### ✅ Organization Endpoints
- [ ] `POST /organizations` - Create hospital
- [ ] `POST /organizations` - Create fleet owner
- [ ] `GET /organizations` - Get all organizations
- [ ] `GET /organizations/:id` - Get organization by ID
- [ ] `PUT /organizations/:id` - Update organization
- [ ] `DELETE /organizations/:id` - Delete organization

### ✅ User Management Endpoints
- [ ] `POST /users` - Create user
- [ ] `GET /users` - Get all users
- [ ] `GET /users/:id` - Get user by ID
- [ ] `PUT /users/:id` - Update user
- [ ] `POST /users/:id/approve` - Approve user
- [ ] `POST /users/:id/reject` - Reject user
- [ ] `POST /users/:id/deactivate` - Deactivate user
- [ ] `DELETE /users/:id` - Delete user

### ✅ Ambulance Endpoints
- [ ] `POST /ambulances` - Create ambulance
- [ ] `GET /ambulances` - Get all ambulances
- [ ] `GET /ambulances/:id` - Get ambulance by ID
- [ ] `PUT /ambulances/:id` - Update ambulance
- [ ] `POST /ambulances/:id/assign` - Assign user
- [ ] `POST /ambulances/:id/unassign` - Unassign user
- [ ] `POST /ambulances/:id/location` - Update location
- [ ] `DELETE /ambulances/:id` - Delete ambulance

### ✅ Patient Endpoints
- [ ] `POST /patients` - Create patient
- [ ] `GET /patients` - Get all patients
- [ ] `GET /patients/:id` - Get patient by ID
- [ ] `PUT /patients/:id` - Update patient
- [ ] `POST /patients/:id/onboard` - Onboard patient
- [ ] `POST /patients/:id/offboard` - Offboard patient
- [ ] `POST /patients/:id/vital-signs` - Add vital signs
- [ ] `GET /patients/:id/vital-signs` - Get vital signs
- [ ] `GET /patients/:id/sessions` - Get sessions
- [ ] `POST /patients/:id/communications` - Add communication
- [ ] `GET /patients/:id/communications` - Get communications
- [ ] `DELETE /patients/:id` - Delete patient

### ✅ Collaboration Endpoints
- [ ] `POST /collaboration/requests` - Create request
- [ ] `GET /collaboration/requests` - Get all requests
- [ ] `GET /collaboration/requests/:id` - Get request by ID
- [ ] `POST /collaboration/requests/:id/approve` - Approve
- [ ] `POST /collaboration/requests/:id/reject` - Reject
- [ ] `POST /collaboration/requests/:id/cancel` - Cancel

---

## 🎯 Testing Scenarios

### Scenario 1: Hospital Onboarding
1. Create hospital organization
2. Create hospital admin user
3. Approve hospital admin
4. Login as hospital admin
5. Create doctors and nurses

### Scenario 2: Fleet Owner Setup
1. Create fleet owner organization
2. Create fleet admin user
3. Approve fleet admin
4. Login as fleet admin
5. Add ambulances
6. Assign drivers and paramedics

### Scenario 3: Emergency Response
1. Create patient record
2. Onboard patient to ambulance
3. Record initial vital signs
4. Update ambulance location (GPS tracking)
5. Add communication notes
6. Record vital signs periodically
7. Offboard patient at hospital

### Scenario 4: Hospital-Fleet Collaboration
1. Login as hospital admin
2. Create collaboration request to fleet owner
3. Login as fleet owner admin
4. Approve collaboration request
5. Assign ambulances to hospital

---

## 🔍 Common Query Parameters

### Organizations
- `?type=HOSPITAL` - Filter by type
- `?type=FLEET_OWNER` - Filter by type
- `?status=active` - Filter by status

### Users
- `?role=DOCTOR` - Filter by role
- `?status=pending` - Filter users awaiting approval
- `?status=active` - Filter active users
- `?organizationId=2` - Filter by organization

### Ambulances
- `?status=available` - Available ambulances
- `?status=on-duty` - Ambulances on duty
- `?vehicleType=ALS` - Filter by type (BLS, ALS, SCU)
- `?organizationId=3` - Filter by fleet owner

### Patients
- `?status=active` - Active patients
- `?organizationId=2` - Filter by hospital

### Collaboration Requests
- `?status=pending` - Pending requests
- `?status=approved` - Approved collaborations

---

## 🛠️ Troubleshooting

### Issue: 401 Unauthorized
**Solution:** 
- Check if access token is valid
- Refresh token using `/auth/refresh`
- Login again

### Issue: 403 Forbidden
**Solution:**
- Check user role permissions
- Ensure user is approved (status='active')
- Verify organization access

### Issue: 404 Not Found
**Solution:**
- Verify the resource ID exists
- Check the endpoint URL
- Ensure resource belongs to your organization

### Issue: 422 Validation Error
**Solution:**
- Check request body format
- Ensure all required fields are present
- Verify data types and formats

### Issue: 500 Internal Server Error
**Solution:**
- Check server logs
- Verify database connection
- Check for data integrity issues

---

## 💡 Pro Tips

### 1. Use Collection Variables
All IDs are automatically saved to variables after creation:
- `{{userId}}`
- `{{organizationId}}`
- `{{ambulanceId}}`
- `{{patientId}}`
- `{{sessionId}}`

### 2. Organize with Folders
The collection is organized into logical folders:
- Authentication
- Organizations
- User Management
- Ambulances
- Patients
- Collaboration

### 3. Use Pre-request Scripts
Collection includes scripts that:
- Automatically add bearer token
- Save response data to variables
- Handle token refresh

### 4. Test Multiple Roles
Create multiple environments for different user roles:
- **Superadmin Environment**
- **Hospital Admin Environment**
- **Fleet Admin Environment**
- **Doctor Environment**

### 5. Use Collection Runner
Run entire collection or folders:
1. Click **Runner** button
2. Select collection/folder
3. Click **Run**
4. View results

---

## 📊 Response Status Codes

### Success Codes
- `200 OK` - Successful GET, PUT requests
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE

### Client Error Codes
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed

### Server Error Codes
- `500 Internal Server Error` - Server error

---

## 🎨 Response Format

All API responses follow this format:

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## 🔗 Useful Links

- **API Documentation:** README.md
- **Database Schema:** DATABASE_SCHEMA.md
- **Quick Start:** QUICK_START.md
- **API Endpoints:** API_ENDPOINTS.md

---

## 🎉 Ready to Test!

1. ✅ Import collection
2. ✅ Start with Health Check
3. ✅ Login as Superadmin
4. ✅ Create organizations
5. ✅ Create users
6. ✅ Test workflows

**Happy Testing! 🚀**

---

*Last Updated: October 30, 2025*

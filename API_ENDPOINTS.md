# RESCULANCE API - Complete Endpoint Reference

## Base URL: `http://localhost:5000/api/v1`

---

## 🔐 Authentication Endpoints

### 1. Register User
- **POST** `/auth/register`
- **Auth Required:** No (for initial registration)
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "hospital_admin",
    "organizationId": 2,
    "phone": "+1234567890"
  }
  ```

### 2. Login
- **POST** `/auth/login`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### 3. Get Profile
- **GET** `/auth/profile`
- **Auth Required:** Yes
- **Headers:** `Authorization: Bearer TOKEN`

### 4. Update Profile
- **PUT** `/auth/profile`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
  ```

### 5. Change Password
- **PUT** `/auth/change-password`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword"
  }
  ```

### 6. Refresh Token
- **POST** `/auth/refresh-token`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "refreshToken": "REFRESH_TOKEN_HERE"
  }
  ```

---

## 🏥 Organization Endpoints

### 1. Create Organization
- **POST** `/organizations`
- **Auth Required:** Yes (Superadmin only)
- **Body:**
  ```json
  {
    "name": "City Hospital",
    "code": "HOSP-001",
    "type": "hospital",
    "address": "123 Main St",
    "contactPerson": "John Doe",
    "contactEmail": "contact@hospital.com",
    "contactPhone": "+1234567890"
  }
  ```

### 2. Get All Organizations
- **GET** `/organizations?type=hospital&status=active&limit=50&offset=0`
- **Auth Required:** Yes

### 3. Get Organization by ID
- **GET** `/organizations/:id`
- **Auth Required:** Yes

### 4. Update Organization
- **PUT** `/organizations/:id`
- **Auth Required:** Yes (Superadmin only)
- **Body:**
  ```json
  {
    "name": "Updated Name",
    "address": "New Address",
    "contactPerson": "Jane Smith",
    "contactEmail": "new@hospital.com",
    "contactPhone": "+1234567891"
  }
  ```

### 5. Delete Organization
- **DELETE** `/organizations/:id`
- **Auth Required:** Yes (Superadmin only)

### 6. Suspend Organization
- **PATCH** `/organizations/:id/suspend`
- **Auth Required:** Yes (Superadmin only)

### 7. Activate Organization
- **PATCH** `/organizations/:id/activate`
- **Auth Required:** Yes (Superadmin only)

---

## 👥 User Endpoints

### 1. Create User
- **POST** `/users`
- **Auth Required:** Yes (Admin roles)
- **Body:**
  ```json
  {
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "hospital_doctor",
    "phone": "+1234567890"
  }
  ```

### 2. Get All Users
- **GET** `/users?role=hospital_doctor&status=active&limit=50&offset=0`
- **Auth Required:** Yes

### 3. Get User by ID
- **GET** `/users/:id`
- **Auth Required:** Yes

### 4. Update User
- **PUT** `/users/:id`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "firstName": "Updated",
    "lastName": "Name",
    "phone": "+1234567890",
    "status": "active"
  }
  ```

### 5. Approve User
- **PATCH** `/users/:id/approve`
- **Auth Required:** Yes (Admin roles)

### 6. Suspend User
- **PATCH** `/users/:id/suspend`
- **Auth Required:** Yes (Admin roles)

### 7. Delete User
- **DELETE** `/users/:id`
- **Auth Required:** Yes (Admin roles)

---

## 🚑 Ambulance Endpoints

### 1. Create Ambulance
- **POST** `/ambulances`
- **Auth Required:** Yes (Admin/Staff roles)
- **Body:**
  ```json
  {
    "ambulanceCode": "AMB-001",
    "registrationNumber": "EMG-12345",
    "vehicleModel": "Mercedes Sprinter",
    "vehicleType": "Advanced Life Support"
  }
  ```

### 2. Get All Ambulances
- **GET** `/ambulances?status=active&limit=50&offset=0`
- **Auth Required:** Yes

### 3. Get My Ambulances
- **GET** `/ambulances/my-ambulances`
- **Auth Required:** Yes (Doctor/Paramedic)

### 4. Get Ambulance by ID
- **GET** `/ambulances/:id`
- **Auth Required:** Yes

### 5. Update Ambulance
- **PUT** `/ambulances/:id`
- **Auth Required:** Yes (Admin/Staff)
- **Body:**
  ```json
  {
    "vehicleModel": "Updated Model",
    "vehicleType": "Type",
    "status": "active"
  }
  ```

### 6. Approve Ambulance
- **PATCH** `/ambulances/:id/approve`
- **Auth Required:** Yes (Superadmin only)

### 7. Assign User to Ambulance
- **POST** `/ambulances/:id/assign-user`
- **Auth Required:** Yes (Admin/Staff)
- **Body:**
  ```json
  {
    "userId": 5
  }
  ```

### 8. Unassign User from Ambulance
- **DELETE** `/ambulances/:id/unassign-user/:userId`
- **Auth Required:** Yes (Admin/Staff)

### 9. Get Assigned Users
- **GET** `/ambulances/:id/assigned-users`
- **Auth Required:** Yes

### 10. Update Ambulance Location
- **PATCH** `/ambulances/:id/location`
- **Auth Required:** Yes (Paramedic)
- **Body:**
  ```json
  {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```

### 11. Delete Ambulance
- **DELETE** `/ambulances/:id`
- **Auth Required:** Yes (Superadmin/Admin)

---

## 🏥 Patient Endpoints

### 1. Create Patient
- **POST** `/patients`
- **Auth Required:** Yes (Admin/Staff/Paramedic)
- **Body:**
  ```json
  {
    "firstName": "Alice",
    "lastName": "Johnson",
    "age": 45,
    "gender": "female",
    "bloodGroup": "O+",
    "contactPhone": "+1234567890",
    "emergencyContactName": "Bob Johnson",
    "emergencyContactPhone": "+1234567891",
    "address": "123 Street",
    "medicalHistory": "Hypertension",
    "allergies": "Penicillin",
    "currentMedications": "Lisinopril"
  }
  ```

### 2. Get All Patients
- **GET** `/patients?search=alice&limit=50&offset=0`
- **Auth Required:** Yes

### 3. Get Patient by Code
- **GET** `/patients/code/:code`
- **Auth Required:** Yes

### 4. Update Patient
- **PUT** `/patients/:id`
- **Auth Required:** Yes (Admin/Staff)
- **Body:**
  ```json
  {
    "firstName": "Updated",
    "lastName": "Name",
    "age": 46,
    "medicalHistory": "Updated history"
  }
  ```

### 5. Hide Patient Data
- **PATCH** `/patients/:id/hide-data`
- **Auth Required:** Yes (Admin/Staff)

### 6. Unhide Patient Data
- **PATCH** `/patients/:id/unhide-data`
- **Auth Required:** Yes (Admin/Staff)

---

## 🚨 Patient Session Endpoints

### 1. Onboard Patient
- **POST** `/patients/onboard`
- **Auth Required:** Yes (Admin/Staff/Paramedic)
- **Body:**
  ```json
  {
    "patientId": 1,
    "ambulanceId": 1,
    "assignedDoctorId": 3,
    "assignedParamedicId": 4,
    "pickupLocation": "123 Street",
    "pickupLat": 40.7128,
    "pickupLng": -74.0060,
    "destinationLocation": "Hospital",
    "destinationLat": 40.7580,
    "destinationLng": -73.9855,
    "chiefComplaint": "Chest pain",
    "initialAssessment": "Patient conscious, BP elevated"
  }
  ```

### 2. Offboard Patient
- **PATCH** `/patients/sessions/:sessionId/offboard`
- **Auth Required:** Yes (Doctor/Paramedic)
- **Body:**
  ```json
  {
    "treatmentNotes": "Patient transported successfully. Vitals stabilized."
  }
  ```

### 3. Get All Sessions
- **GET** `/patients/sessions?status=onboarded&limit=50&offset=0`
- **Auth Required:** Yes

### 4. Get Session by ID
- **GET** `/patients/sessions/:sessionId`
- **Auth Required:** Yes

### 5. Add Vital Signs
- **POST** `/patients/sessions/:sessionId/vitals`
- **Auth Required:** Yes (Doctor/Paramedic)
- **Body:**
  ```json
  {
    "heartRate": 95,
    "bloodPressureSystolic": 160,
    "bloodPressureDiastolic": 95,
    "oxygenSaturation": 92,
    "temperature": 37.2,
    "respiratoryRate": 22,
    "glucoseLevel": 120.5
  }
  ```

### 6. Add Communication
- **POST** `/patients/sessions/:sessionId/communications`
- **Auth Required:** Yes (Doctor/Paramedic)
- **Body:**
  ```json
  {
    "receiverId": 4,
    "communicationType": "text",
    "message": "Please monitor vitals every 2 minutes",
    "duration": null
  }
  ```

---

## 🤝 Collaboration Endpoints

### 1. Create Collaboration Request
- **POST** `/collaborations`
- **Auth Required:** Yes (Hospital Admin/Staff)
- **Body:**
  ```json
  {
    "fleetOwnerCode": "FLEET-001",
    "ambulanceCode": "AMB-FLEET-001",
    "requestMessage": "We need an ambulance for emergency services"
  }
  ```

### 2. Get All Collaboration Requests
- **GET** `/collaborations?status=pending&limit=50&offset=0`
- **Auth Required:** Yes

### 3. Get Collaboration Request by ID
- **GET** `/collaborations/:id`
- **Auth Required:** Yes

### 4. Accept Collaboration Request
- **PATCH** `/collaborations/:id/accept`
- **Auth Required:** Yes (Fleet Admin/Staff)
- **Body:**
  ```json
  {
    "responseMessage": "Request accepted. Ambulance available for use."
  }
  ```

### 5. Reject Collaboration Request
- **PATCH** `/collaborations/:id/reject`
- **Auth Required:** Yes (Fleet Admin/Staff)
- **Body:**
  ```json
  {
    "responseMessage": "Sorry, ambulance not available at this time."
  }
  ```

### 6. Cancel Collaboration Request
- **PATCH** `/collaborations/:id/cancel`
- **Auth Required:** Yes (Hospital Admin/Staff)

---

## 📊 Query Parameters Reference

### Pagination
- `limit` - Number of records to return (default: 50)
- `offset` - Number of records to skip (default: 0)

### Filters
- `status` - Filter by status (active, inactive, pending, etc.)
- `type` - Filter by type (hospital, fleet_owner)
- `role` - Filter by user role
- `search` - Search term for name/code
- `organizationId` - Filter by organization

### Example
```
GET /users?role=hospital_doctor&status=active&limit=20&offset=0
```

---

## 🔒 Authorization Matrix

| Endpoint Group | Superadmin | Hospital Admin | Hospital Staff | Hospital Doctor | Hospital Paramedic | Fleet Admin | Fleet Staff | Fleet Doctor | Fleet Paramedic |
|---------------|------------|----------------|----------------|-----------------|-------------------|-------------|-------------|--------------|-----------------|
| Organizations | Full | Read | Read | Read | Read | Read | Read | Read | Read |
| Users | Full | Manage Own Org | Read Own Org | Read | Read | Manage Own Org | Read Own Org | Read | Read |
| Ambulances | Full | Manage Own | Manage Own | Read Assigned | Read Assigned | Manage Own | Manage Own | Read Assigned | Read Assigned |
| Patients | Full | Full | Full | Read | Create/Onboard | Full | Full | Read | Create/Onboard |
| Collaborations | Read All | Create/Cancel | Create/Cancel | - | - | Accept/Reject | Accept/Reject | - | - |

---

## 🔧 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## 📝 Notes

1. All authenticated endpoints require `Authorization: Bearer TOKEN` header
2. Timestamps are in ISO 8601 format (UTC)
3. IDs are integers (auto-increment)
4. Codes are unique string identifiers
5. Enum fields must match exact values (case-sensitive)
6. Required fields will return 400 error if missing
7. Invalid permissions return 403 Forbidden
8. Not found resources return 404

---

## 🧪 Testing Tips

1. Always login first to get access token
2. Save token in environment variable for reuse
3. Test with different user roles to verify permissions
4. Use pagination for large datasets
5. Check audit logs for tracking changes
6. Test Socket.IO events for real-time features

---

**Last Updated:** October 2025
**API Version:** v1

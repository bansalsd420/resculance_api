# 📊 RESCULANCE API - Database Schema Documentation

## Overview

The RESCULANCE database consists of 14 tables that handle the complete lifecycle of ambulance operations, patient management, and organizational relationships.

---

## Entity Relationship Diagram (Conceptual)

```
┌─────────────────┐
│  Organizations  │ (Hospitals & Fleet Owners)
└────────┬────────┘
         │ 1:N
         │
    ┌────┴─────┬──────────────┬────────────┐
    │          │              │            │
┌───▼───┐  ┌──▼────┐  ┌──────▼──────┐ ┌──▼──────────────┐
│ Users │  │ Ambu  │  │Collaboration│ │  Audit Logs     │
│       │  │lances │  │  Requests   │ │                 │
└───┬───┘  └───┬───┘  └─────────────┘ └─────────────────┘
    │          │
    │ N:M      │ 1:N
    │     ┌────┴────┐
    │     │ Smart   │
    │     │ Devices │
    │     └─────────┘
    │
    │ N:M (Ambulance User Mappings)
    │
┌───▼──────────┐
│   Patients   │
└───┬──────────┘
    │ 1:N
┌───▼────────────────┐
│ Patient Sessions   │
└───┬────────────────┘
    │ 1:N
    ├──────────────┬────────────────┐
    │              │                │
┌───▼──────┐  ┌───▼──────────┐ ┌──▼─────────┐
│  Vital   │  │Communications│ │  Location  │
│  Signs   │  │              │ │   Data     │
└──────────┘  └──────────────┘ └────────────┘
```

---

## Table Details

### 1. organizations

**Purpose:** Stores all hospitals and fleet owner companies

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| name | VARCHAR(255) | Organization name |
| code | VARCHAR(50) UNIQUE | Unique org code (e.g., HOSP-001) |
| type | ENUM | 'hospital' or 'fleet_owner' |
| address | TEXT | Physical address |
| contact_person | VARCHAR(255) | Primary contact name |
| contact_email | VARCHAR(255) | Contact email |
| contact_phone | VARCHAR(20) | Contact phone |
| status | ENUM | 'active', 'inactive', 'suspended' |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (code)
- INDEX (type)
- INDEX (status)

**Example Data:**
```json
{
  "id": 1,
  "name": "City General Hospital",
  "code": "CGH-001",
  "type": "hospital",
  "status": "active"
}
```

---

### 2. users

**Purpose:** All user accounts with role-based access

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| organization_id | INT (FK) | References organizations(id) |
| username | VARCHAR(100) UNIQUE | Login username |
| email | VARCHAR(255) UNIQUE | Email address |
| password | VARCHAR(255) | Bcrypt hashed password |
| role | ENUM | User role (9 types) |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| phone | VARCHAR(20) | Phone number |
| status | ENUM | 'pending_approval', 'active', 'inactive', 'suspended' |
| last_login | TIMESTAMP | Last login time |
| created_by | INT (FK) | User who created this account |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Roles:**
- superadmin
- hospital_admin
- hospital_staff
- hospital_doctor
- hospital_paramedic
- fleet_admin
- fleet_staff
- fleet_doctor
- fleet_paramedic

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (username)
- UNIQUE INDEX (email)
- INDEX (organization_id)
- INDEX (role)
- INDEX (status)
- FOREIGN KEY (organization_id) → organizations(id)
- FOREIGN KEY (created_by) → users(id)

---

### 3. ambulances

**Purpose:** Ambulance fleet management

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| organization_id | INT (FK) | Owner organization |
| ambulance_code | VARCHAR(50) UNIQUE | Unique ambulance code |
| registration_number | VARCHAR(100) UNIQUE | Vehicle registration |
| vehicle_model | VARCHAR(255) | Vehicle model |
| vehicle_type | VARCHAR(100) | Type (ALS, BLS, etc.) |
| status | ENUM | Current status |
| current_hospital_id | INT (FK) | Hospital currently using |
| current_location_lat | DECIMAL(10,8) | GPS latitude |
| current_location_lng | DECIMAL(11,8) | GPS longitude |
| last_location_update | TIMESTAMP | Last GPS update |
| approved_by | INT (FK) | Superadmin who approved |
| approved_at | TIMESTAMP | Approval timestamp |
| created_by | INT (FK) | User who created |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Status Values:**
- pending_approval
- active
- inactive
- en_route
- maintenance
- suspended

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (ambulance_code)
- UNIQUE INDEX (registration_number)
- INDEX (organization_id)
- INDEX (status)
- INDEX (current_hospital_id)

---

### 4. smart_devices

**Purpose:** Medical devices installed in ambulances

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| ambulance_id | INT (FK) | Ambulance reference |
| device_id | VARCHAR(100) UNIQUE | Device serial number |
| device_type | ENUM | Type of device |
| device_name | VARCHAR(255) | Device name |
| manufacturer | VARCHAR(255) | Manufacturer |
| model | VARCHAR(255) | Device model |
| status | ENUM | 'active', 'inactive', 'maintenance' |
| last_sync | TIMESTAMP | Last data sync |
| created_at | TIMESTAMP | Installation date |
| updated_at | TIMESTAMP | Last update |

**Device Types:**
- ecg (ECG Monitor)
- bp_monitor (Blood Pressure)
- pulse_oximeter (SpO2)
- glucose_monitor
- gps_tracker
- temperature
- ventilator

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (device_id)
- INDEX (ambulance_id)
- INDEX (device_type)
- FOREIGN KEY (ambulance_id) → ambulances(id)

---

### 5. ambulance_user_mappings

**Purpose:** Assign doctors/paramedics to ambulances

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| ambulance_id | INT (FK) | Ambulance reference |
| user_id | INT (FK) | User reference |
| assigned_at | TIMESTAMP | Assignment date |
| assigned_by | INT (FK) | Who assigned |
| is_active | BOOLEAN | Active status |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (ambulance_id, user_id)
- INDEX (ambulance_id)
- INDEX (user_id)
- FOREIGN KEY (ambulance_id) → ambulances(id)
- FOREIGN KEY (user_id) → users(id)
- FOREIGN KEY (assigned_by) → users(id)

---

### 6. collaboration_requests

**Purpose:** Hospitals requesting fleet ambulances

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| hospital_id | INT (FK) | Requesting hospital |
| fleet_owner_id | INT (FK) | Target fleet owner |
| ambulance_id | INT (FK) | Specific ambulance |
| status | ENUM | Request status |
| requested_by | INT (FK) | User who requested |
| request_message | TEXT | Request details |
| response_message | TEXT | Response from fleet |
| responded_by | INT (FK) | User who responded |
| responded_at | TIMESTAMP | Response time |
| created_at | TIMESTAMP | Request time |
| updated_at | TIMESTAMP | Last update |

**Status Values:**
- pending
- accepted
- rejected
- cancelled

---

### 7. patients

**Purpose:** Patient master data

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| patient_code | VARCHAR(50) UNIQUE | Unique patient code |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| age | INT | Age |
| gender | ENUM | 'male', 'female', 'other' |
| blood_group | VARCHAR(10) | Blood type |
| contact_phone | VARCHAR(20) | Phone number |
| emergency_contact_name | VARCHAR(255) | Emergency contact |
| emergency_contact_phone | VARCHAR(20) | Emergency phone |
| address | TEXT | Address |
| medical_history | TEXT | Medical history |
| allergies | TEXT | Known allergies |
| current_medications | TEXT | Current medications |
| is_data_hidden | BOOLEAN | Privacy flag |
| hidden_by | INT (FK) | Who hid data |
| hidden_at | TIMESTAMP | When hidden |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (patient_code)
- FOREIGN KEY (hidden_by) → users(id)

---

### 8. patient_sessions

**Purpose:** Each ambulance trip with a patient

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| session_code | VARCHAR(50) UNIQUE | Unique session code |
| patient_id | INT (FK) | Patient reference |
| ambulance_id | INT (FK) | Ambulance used |
| hospital_id | INT (FK) | Hospital reference |
| fleet_owner_id | INT (FK) | Fleet owner (if applicable) |
| assigned_doctor_id | INT (FK) | Assigned doctor |
| assigned_paramedic_id | INT (FK) | Assigned paramedic |
| pickup_location | TEXT | Pickup address |
| pickup_lat | DECIMAL(10,8) | Pickup GPS lat |
| pickup_lng | DECIMAL(11,8) | Pickup GPS lng |
| destination_location | TEXT | Destination address |
| destination_lat | DECIMAL(10,8) | Destination GPS lat |
| destination_lng | DECIMAL(11,8) | Destination GPS lng |
| status | ENUM | Session status |
| chief_complaint | TEXT | Initial complaint |
| initial_assessment | TEXT | Paramedic assessment |
| treatment_notes | TEXT | Treatment summary |
| onboarded_by | INT (FK) | Who onboarded |
| onboarded_at | TIMESTAMP | Onboard time |
| offboarded_by | INT (FK) | Who offboarded |
| offboarded_at | TIMESTAMP | Offboard time |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

**Status Values:**
- onboarded
- in_transit
- offboarded
- cancelled

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (session_code)
- INDEX (patient_id)
- INDEX (ambulance_id)
- INDEX (hospital_id)
- INDEX (status)

---

### 9. vital_signs

**Purpose:** Real-time vital signs during transport

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| session_id | INT (FK) | Session reference |
| device_id | INT (FK) | Device that captured |
| heart_rate | INT | Beats per minute |
| blood_pressure_systolic | INT | Systolic BP |
| blood_pressure_diastolic | INT | Diastolic BP |
| oxygen_saturation | INT | SpO2 percentage |
| temperature | DECIMAL(5,2) | Temperature (°C) |
| respiratory_rate | INT | Breaths per minute |
| glucose_level | DECIMAL(5,2) | Blood glucose |
| ecg_data | TEXT | ECG waveform data |
| recorded_at | TIMESTAMP | Capture time |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (session_id)
- INDEX (recorded_at)
- FOREIGN KEY (session_id) → patient_sessions(id)
- FOREIGN KEY (device_id) → smart_devices(id)

---

### 10. communications

**Purpose:** Log all communications between staff

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| session_id | INT (FK) | Session reference |
| sender_id | INT (FK) | Sender user |
| receiver_id | INT (FK) | Receiver user |
| communication_type | ENUM | 'text', 'call', 'video' |
| message | TEXT | Message content |
| duration | INT | Call duration (seconds) |
| created_at | TIMESTAMP | Time sent |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (session_id)
- INDEX (sender_id)
- INDEX (communication_type)
- FOREIGN KEY (session_id) → patient_sessions(id)
- FOREIGN KEY (sender_id) → users(id)
- FOREIGN KEY (receiver_id) → users(id)

---

### 11. audit_logs

**Purpose:** Track all important actions for accountability

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| user_id | INT (FK) | User who acted |
| action | VARCHAR(255) | Action performed |
| entity_type | VARCHAR(100) | Type of entity |
| entity_id | INT | Entity ID |
| old_values | TEXT | Before values (JSON) |
| new_values | TEXT | After values (JSON) |
| ip_address | VARCHAR(45) | IP address |
| user_agent | TEXT | Browser/client info |
| created_at | TIMESTAMP | Action time |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (entity_type, entity_id)
- INDEX (created_at)
- FOREIGN KEY (user_id) → users(id)

---

### 12. refresh_tokens

**Purpose:** Store JWT refresh tokens

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Unique identifier |
| user_id | INT (FK) | User reference |
| token | VARCHAR(500) | Refresh token |
| expires_at | TIMESTAMP | Expiry time |
| created_at | TIMESTAMP | Creation time |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (token)
- FOREIGN KEY (user_id) → users(id)

---

## Data Flow Examples

### Example 1: Patient Onboarding Flow

```
1. CREATE patient record → patients table
2. CREATE session → patient_sessions table
3. UPDATE ambulance status to 'en_route' → ambulances table
4. LOG action → audit_logs table
5. EMIT Socket event 'patient_onboarded'
```

### Example 2: Vital Signs Update Flow

```
1. Device captures vitals
2. INSERT vital signs → vital_signs table
3. EMIT Socket event 'vital_update' to session room
4. Doctor receives real-time update
```

### Example 3: Collaboration Request Flow

```
1. Hospital CREATES request → collaboration_requests table
2. Fleet owner RECEIVES notification
3. Fleet owner ACCEPTS → UPDATE status to 'accepted'
4. Hospital can now use ambulance
5. LOG all actions → audit_logs table
```

---

## Performance Optimization

### Indexes
All tables have appropriate indexes on:
- Primary keys
- Foreign keys
- Frequently queried columns (status, type, dates)
- Unique constraints

### Query Optimization
- Use of JOINs for related data
- Pagination for large datasets
- Connection pooling (10 connections)
- Prepared statements (SQL injection prevention)

---

## Backup Strategy (Recommended)

```sql
-- Daily backup
mysqldump -u root -p resculance_db > backup_$(date +%Y%m%d).sql

-- Restore
mysql -u root -p resculance_db < backup_20251030.sql
```

---

## Database Maintenance

### Regular Tasks
1. Monitor slow queries
2. Optimize indexes
3. Clean old audit logs (keep 90 days)
4. Archive completed sessions
5. Backup daily
6. Monitor disk space

### Cleanup Queries (Example)

```sql
-- Delete old audit logs (older than 90 days)
DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Archive old patient sessions
-- Move to archive table before deleting
```

---

## Security Considerations

1. **Password Storage:** Bcrypt hashed (10 rounds)
2. **SQL Injection:** Prevented by parameterized queries
3. **Access Control:** Enforced at application layer
4. **Data Encryption:** Consider encrypting sensitive fields
5. **Audit Trail:** All critical actions logged

---

**Database Version:** MySQL 8.0+  
**Character Set:** utf8mb4  
**Collation:** utf8mb4_unicode_ci  
**Engine:** InnoDB (transactions, foreign keys)

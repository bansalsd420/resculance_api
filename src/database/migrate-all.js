require('dotenv').config();
const db = require('../config/database');

async function migrateAll() {
  console.log('🚀 Running all database migrations...\n');

  // Step 1: Run main schema migration
  console.log('📋 Step 1: Creating main database schema...');
  await runMainMigration();
  console.log('✅ Main schema created\n');

  // Step 2: Apply table alterations (device authentication fields)
  console.log('📋 Step 2: Applying table alterations...');
  await applyAlterations();
  console.log('✅ Table alterations applied\n');

  console.log('🎉 All migrations completed successfully!\n');
}

async function runMainMigration() {
  const schema = `
-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('hospital', 'fleet_owner', 'superadmin') NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(20),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'hospital_admin', 'hospital_staff', 'hospital_doctor', 'hospital_paramedic', 
            'fleet_admin', 'fleet_staff', 'fleet_doctor', 'fleet_paramedic') NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  status ENUM('pending_approval', 'active', 'inactive', 'suspended') DEFAULT 'pending_approval',
  last_login TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_organization (organization_id),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ambulances Table
CREATE TABLE IF NOT EXISTS ambulances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  ambulance_code VARCHAR(50) UNIQUE NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_model VARCHAR(100),
  vehicle_type ENUM('BLS', 'ALS', 'SCU') NOT NULL,
  status ENUM('pending_approval', 'active', 'inactive', 'maintenance', 'available', 'on_trip', 'emergency') DEFAULT 'pending_approval',
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  current_hospital_id INT,
  last_location_update TIMESTAMP NULL,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (current_hospital_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_status (status),
  INDEX idx_registration (registration_number),
  INDEX idx_location (current_location_lat, current_location_lng)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ambulance Devices Table (Multiple devices per ambulance - cameras, GPS, ECG, etc.)
CREATE TABLE IF NOT EXISTS ambulance_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ambulance_id INT NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type ENUM('CAMERA', 'LIVE_LOCATION', 'ECG', 'VITAL_MONITOR', 'GPS_TRACKER') NOT NULL,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_username VARCHAR(255),
  device_password VARCHAR(255),
  device_api TEXT,
  jsession VARCHAR(500),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
  INDEX idx_ambulance (ambulance_id),
  INDEX idx_device_type (device_type),
  INDEX idx_device_id (device_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Smart Devices Table (Legacy - keeping for backwards compatibility)
CREATE TABLE IF NOT EXISTS smart_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ambulance_id INT NOT NULL,
  device_id VARCHAR(100) UNIQUE NOT NULL,
  device_type ENUM('ecg', 'bp_monitor', 'pulse_oximeter', 'glucose_monitor', 'gps_tracker', 'temperature', 'ventilator') NOT NULL,
  device_name VARCHAR(255),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
  INDEX idx_ambulance (ambulance_id),
  INDEX idx_device_type (device_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ambulance User Mappings Table (Doctors and Paramedics assigned to ambulances)
CREATE TABLE IF NOT EXISTS ambulance_user_mappings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ambulance_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_ambulance_user (ambulance_id, user_id),
  INDEX idx_ambulance (ambulance_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ambulance Assignments Table (New: records which organization assigned which staff to an ambulance)
CREATE TABLE IF NOT EXISTS ambulance_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ambulance_id INT NOT NULL,
  user_id INT NOT NULL,
  assigning_organization_id INT,
  assigned_by INT,
  role VARCHAR(100),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigning_organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_ambulance_assignment (ambulance_id, user_id, assigning_organization_id),
  INDEX idx_ambulance_assignment_ambulance (ambulance_id),
  INDEX idx_ambulance_assignment_user (user_id),
  INDEX idx_ambulance_assignment_org (assigning_organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collaboration Requests Table (Hospital requesting Fleet ambulance)
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  fleet_id INT NOT NULL,
  request_type ENUM('partnership', 'one_time', 'emergency') NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  message TEXT,
  terms TEXT,
  requested_by INT NOT NULL,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (fleet_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital (hospital_id),
  INDEX idx_fleet (fleet_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Partnerships Table (Fleet <-> Hospital partnerships)
CREATE TABLE IF NOT EXISTS partnerships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fleet_id INT NOT NULL,
  hospital_id INT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fleet_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_partnership (fleet_id, hospital_id),
  INDEX idx_fleet (fleet_id),
  INDEX idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  patient_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  age INT,
  gender ENUM('male', 'female', 'other') NOT NULL,
  blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(100),
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  insurance_provider VARCHAR(255),
  insurance_number VARCHAR(100),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_patient_code (patient_code),
  INDEX idx_name (first_name, last_name),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patient Sessions Table (Trips/Transport Sessions)
CREATE TABLE IF NOT EXISTS patient_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  ambulance_id INT NOT NULL,
  organization_id INT NOT NULL,
  session_code VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('onboarded', 'in_transit', 'offboarded', 'cancelled') DEFAULT 'onboarded',
  pickup_location TEXT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  destination_hospital_id INT,
  destination_location TEXT,
  destination_latitude DECIMAL(10, 8),
  destination_longitude DECIMAL(11, 8),
  chief_complaint TEXT NULL,
  initial_assessment TEXT,
  treatment_notes TEXT,
  outcome_status ENUM('stable', 'improved', 'critical', 'deceased'),
  onboarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  offboarded_at TIMESTAMP NULL,
  onboarded_by INT NOT NULL,
  offboarded_by INT,
  estimated_arrival_time TIMESTAMP NULL,
  actual_arrival_time TIMESTAMP NULL,
  distance_km DECIMAL(10, 2),
  duration_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_hospital_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (onboarded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (offboarded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_ambulance (ambulance_id),
  INDEX idx_organization (organization_id),
  INDEX idx_status (status),
  INDEX idx_session_code (session_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vital Signs Table
CREATE TABLE IF NOT EXISTS vital_signs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  session_id INT,
  heart_rate INT,
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  temperature DECIMAL(4, 1),
  respiratory_rate INT,
  oxygen_saturation INT,
  blood_glucose INT,
  consciousness_level ENUM('alert', 'verbal', 'pain', 'unresponsive'),
  pain_scale INT,
  notes TEXT,
  recorded_by INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES patient_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_session (session_id),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Communications Table (In-transit communications)
CREATE TABLE IF NOT EXISTS communications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_type ENUM('text', 'voice', 'video', 'alert', 'vital_update', 'location_update') NOT NULL,
  message TEXT,
  metadata JSON,
  read_by JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES patient_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session (session_id),
  INDEX idx_sender (sender_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

  await db.query(schema);
}

async function applyAlterations() {
  // Check if columns already exist before adding
  try {
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'ambulance_devices' 
        AND COLUMN_NAME IN ('device_username', 'jsession')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    if (!existingColumns.includes('device_username')) {
      await db.query(`
        ALTER TABLE ambulance_devices 
        ADD COLUMN device_username VARCHAR(255) AFTER device_id
      `);
      console.log('  ✓ Added device_username column');
    }

    if (!existingColumns.includes('jsession')) {
      await db.query(`
        ALTER TABLE ambulance_devices 
        ADD COLUMN jsession VARCHAR(500) AFTER device_api
      `);
      console.log('  ✓ Added jsession column');
    }
  } catch (error) {
    // If table doesn't exist yet, that's okay - main migration will create it
    if (error.code !== 'ER_NO_SUCH_TABLE') {
      throw error;
    }
  }
}

if (require.main === module) {
  migrateAll()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error.message);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateAll };

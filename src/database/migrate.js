require('dotenv').config();
const db = require('../config/database');

const schema = `
-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('hospital', 'fleet_owner') NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
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
  license_number VARCHAR(100),
  specialization VARCHAR(255),
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
  registration_number VARCHAR(100) UNIQUE NOT NULL,
  vehicle_model VARCHAR(255),
  vehicle_type VARCHAR(100),
  status ENUM('pending_approval', 'active', 'available', 'inactive', 'en_route', 'maintenance', 'suspended') DEFAULT 'pending_approval',
  current_hospital_id INT NULL,
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  last_location_update TIMESTAMP NULL,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (current_hospital_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_organization (organization_id),
  INDEX idx_code (ambulance_code),
  INDEX idx_status (status),
  INDEX idx_current_hospital (current_hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ambulance Devices Table (Multiple devices per ambulance - cameras, GPS, ECG, etc.)
CREATE TABLE IF NOT EXISTS ambulance_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ambulance_id INT NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type ENUM('CAMERA', 'LIVE_LOCATION', 'ECG', 'VITAL_MONITOR', 'GPS_TRACKER') NOT NULL,
  device_id VARCHAR(255) NOT NULL,
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
  INDEX idx_status (status),
  UNIQUE KEY unique_ambulance_device (ambulance_id, device_id)
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

-- Collaboration Requests Table (Hospital requesting Fleet ambulance)
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  fleet_id INT NOT NULL,
  ambulance_id INT NULL,
  request_type ENUM('partnership', 'one_time') DEFAULT 'partnership',
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  requested_by INT NOT NULL,
  message TEXT,
  response_message TEXT,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (fleet_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE SET NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital (hospital_id),
  INDEX idx_fleet (fleet_id),
  INDEX idx_ambulance (ambulance_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  patient_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  age INT,
  gender ENUM('male', 'female', 'other'),
  blood_group VARCHAR(10),
  phone VARCHAR(20),
  contact_phone VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(100),
  address TEXT,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  is_data_hidden BOOLEAN DEFAULT FALSE,
  hidden_by INT,
  hidden_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hidden_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient_code (patient_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patient Sessions Table (Each ambulance trip/session with a patient)
CREATE TABLE IF NOT EXISTS patient_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_code VARCHAR(50) UNIQUE NOT NULL,
  patient_id INT NOT NULL,
  ambulance_id INT NOT NULL,
  organization_id INT NOT NULL,
  hospital_id INT NOT NULL,
  fleet_owner_id INT,
  destination_hospital_id INT,
  assigned_doctor_id INT,
  assigned_paramedic_id INT,
  pickup_location TEXT,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  destination_location TEXT,
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  status ENUM('onboarded', 'in_transit', 'offboarded', 'cancelled') DEFAULT 'onboarded',
  chief_complaint TEXT,
  initial_assessment TEXT,
  treatment_notes TEXT,
  onboarded_by INT NOT NULL,
  onboarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  offboarded_by INT,
  offboarded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (fleet_owner_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (destination_hospital_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_paramedic_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (onboarded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (offboarded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_ambulance (ambulance_id),
  INDEX idx_hospital (hospital_id),
  INDEX idx_status (status),
  INDEX idx_session_code (session_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vital Signs Table (Real-time data from smart devices)
CREATE TABLE IF NOT EXISTS vital_signs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT,
  session_id INT NOT NULL,
  device_id INT,
  recorded_by INT,
  heart_rate INT,
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  oxygen_saturation INT,
  temperature DECIMAL(5, 2),
  respiratory_rate INT,
  glucose_level DECIMAL(5, 2),
  ecg_data TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES patient_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES smart_devices(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_session (session_id),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Communications Table (Chat, call, video logs between doctors and paramedics)
CREATE TABLE IF NOT EXISTS communications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT,
  communication_type ENUM('text', 'call', 'video') NOT NULL,
  message TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  metadata TEXT,
  read_by JSON,
  duration INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES patient_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_session (session_id),
  INDEX idx_sender (sender_id),
  INDEX idx_type (communication_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table (Track all important actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens Table (For JWT refresh tokens)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
      const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      if (tableName) {
        console.log(`✅ Table '${tableName}' created/verified`);
      }
    }

    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate, schema };

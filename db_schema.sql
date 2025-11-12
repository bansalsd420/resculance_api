-- Database schema export for u516792586_resculance
-- Generated: 2025-11-11T19:44:11.881Z

SET FOREIGN_KEY_CHECKS=0;

-- Table: activity_logs
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity` varchar(100) NOT NULL,
  `comments` text NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `organization_name` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_activity` (`activity`),
  KEY `idx_user` (`user_id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ambulance_assignments
CREATE TABLE `ambulance_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ambulance_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigning_organization_id` int(11) DEFAULT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ambulance_assignment` (`ambulance_id`,`user_id`,`assigning_organization_id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `idx_ambulance_assignment_ambulance` (`ambulance_id`),
  KEY `idx_ambulance_assignment_user` (`user_id`),
  KEY `idx_ambulance_assignment_org` (`assigning_organization_id`),
  CONSTRAINT `ambulance_assignments_ibfk_1` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ambulance_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ambulance_assignments_ibfk_3` FOREIGN KEY (`assigning_organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ambulance_assignments_ibfk_4` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ambulance_devices
CREATE TABLE `ambulance_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ambulance_id` int(11) NOT NULL,
  `device_name` varchar(255) NOT NULL,
  `device_type` enum('CAMERA','LIVE_LOCATION','ECG','VITAL_MONITOR','GPS_TRACKER') NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `device_username` varchar(255) DEFAULT NULL,
  `device_password` varchar(255) DEFAULT NULL,
  `device_api` text DEFAULT NULL,
  `jsession` varchar(500) DEFAULT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `last_sync` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_id` (`device_id`),
  KEY `idx_ambulance` (`ambulance_id`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `ambulance_devices_ibfk_1` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ambulance_user_mappings
CREATE TABLE `ambulance_user_mappings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ambulance_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ambulance_user` (`ambulance_id`,`user_id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `idx_ambulance` (`ambulance_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `ambulance_user_mappings_ibfk_1` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ambulance_user_mappings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ambulance_user_mappings_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ambulances
CREATE TABLE `ambulances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organization_id` int(11) NOT NULL,
  `ambulance_code` varchar(50) NOT NULL,
  `registration_number` varchar(50) NOT NULL,
  `vehicle_model` varchar(100) DEFAULT NULL,
  `vehicle_type` enum('BLS','ALS','SCU') NOT NULL,
  `status` enum('pending_approval','active','inactive','maintenance','available','on_trip','emergency','disabled') DEFAULT 'pending_approval',
  `current_location_lat` decimal(10,8) DEFAULT NULL,
  `current_location_lng` decimal(11,8) DEFAULT NULL,
  `current_hospital_id` int(11) DEFAULT NULL,
  `last_location_update` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ambulance_code` (`ambulance_code`),
  UNIQUE KEY `registration_number` (`registration_number`),
  KEY `current_hospital_id` (`current_hospital_id`),
  KEY `approved_by` (`approved_by`),
  KEY `created_by` (`created_by`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_status` (`status`),
  KEY `idx_registration` (`registration_number`),
  KEY `idx_location` (`current_location_lat`,`current_location_lng`),
  CONSTRAINT `ambulances_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ambulances_ibfk_2` FOREIGN KEY (`current_hospital_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ambulances_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ambulances_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: collaboration_requests
CREATE TABLE `collaboration_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hospital_id` int(11) NOT NULL,
  `fleet_id` int(11) NOT NULL,
  `request_type` enum('partnership','one_time','emergency') NOT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `message` text DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `requested_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `requested_by` (`requested_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_hospital` (`hospital_id`),
  KEY `idx_fleet` (`fleet_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `collaboration_requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `collaboration_requests_ibfk_2` FOREIGN KEY (`fleet_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `collaboration_requests_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `collaboration_requests_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: communications
CREATE TABLE `communications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message_type` enum('text','voice','video','alert','vital_update','location_update') NOT NULL,
  `message` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `read_by` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`read_by`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `communications_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `patient_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `communications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: notifications
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_created_at` (`created_at` DESC),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: organizations
CREATE TABLE `organizations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('hospital','fleet_owner','superadmin') NOT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `pincode` varchar(20) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: partnerships
CREATE TABLE `partnerships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fleet_id` int(11) NOT NULL,
  `hospital_id` int(11) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `duration_months` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_partnership` (`fleet_id`,`hospital_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_fleet` (`fleet_id`),
  KEY `idx_hospital` (`hospital_id`),
  CONSTRAINT `partnerships_ibfk_1` FOREIGN KEY (`fleet_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `partnerships_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `partnerships_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: patient_session_data
CREATE TABLE `patient_session_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `data_type` enum('note','medication','file') NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content`)),
  `added_by` int(11) NOT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_data_type` (`data_type`),
  KEY `idx_added_by` (`added_by`),
  KEY `idx_session_type` (`session_id`,`data_type`),
  CONSTRAINT `patient_session_data_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `patient_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `patient_session_data_ibfk_2` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: patient_sessions
CREATE TABLE `patient_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `ambulance_id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `session_code` varchar(50) NOT NULL,
  `status` enum('onboarded','in_transit','offboarded','cancelled') DEFAULT 'onboarded',
  `pickup_location` text DEFAULT NULL,
  `pickup_latitude` decimal(10,8) DEFAULT NULL,
  `pickup_longitude` decimal(11,8) DEFAULT NULL,
  `destination_hospital_id` int(11) DEFAULT NULL,
  `destination_location` text DEFAULT NULL,
  `destination_latitude` decimal(10,8) DEFAULT NULL,
  `destination_longitude` decimal(11,8) DEFAULT NULL,
  `chief_complaint` text DEFAULT NULL,
  `initial_assessment` text DEFAULT NULL,
  `treatment_notes` text DEFAULT NULL,
  `outcome_status` enum('stable','improved','critical','deceased') DEFAULT NULL,
  `onboarded_at` timestamp NULL DEFAULT current_timestamp(),
  `offboarded_at` timestamp NULL DEFAULT NULL,
  `onboarded_by` int(11) NOT NULL,
  `offboarded_by` int(11) DEFAULT NULL,
  `estimated_arrival_time` timestamp NULL DEFAULT NULL,
  `actual_arrival_time` timestamp NULL DEFAULT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `session_metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Complete session audit trail including crew, timeline, locations, and all changes' CHECK (json_valid(`session_metadata`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_code` (`session_code`),
  KEY `destination_hospital_id` (`destination_hospital_id`),
  KEY `onboarded_by` (`onboarded_by`),
  KEY `offboarded_by` (`offboarded_by`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_ambulance` (`ambulance_id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_status` (`status`),
  KEY `idx_session_code` (`session_code`),
  KEY `idx_ps_patient_status_created` (`patient_id`,`status`,`created_at`),
  KEY `idx_ps_ambulance_id` (`ambulance_id`),
  CONSTRAINT `patient_sessions_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `patient_sessions_ibfk_2` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`id`) ON DELETE CASCADE,
  CONSTRAINT `patient_sessions_ibfk_3` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `patient_sessions_ibfk_4` FOREIGN KEY (`destination_hospital_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `patient_sessions_ibfk_5` FOREIGN KEY (`onboarded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `patient_sessions_ibfk_6` FOREIGN KEY (`offboarded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: patients
CREATE TABLE `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organization_id` int(11) DEFAULT NULL,
  `patient_code` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `pincode` varchar(20) DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relation` varchar(100) DEFAULT NULL,
  `medical_history` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `current_medications` text DEFAULT NULL,
  `insurance_provider` varchar(255) DEFAULT NULL,
  `insurance_number` varchar(100) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_onboarded` tinyint(1) DEFAULT 0,
  `current_session_id` int(11) DEFAULT NULL,
  `onboarded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patient_code` (`patient_code`),
  KEY `created_by` (`created_by`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_patient_code` (`patient_code`),
  KEY `idx_name` (`first_name`,`last_name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_patients_is_active` (`is_active`),
  KEY `idx_patients_org_is_active_created_at` (`organization_id`,`is_active`,`created_at`),
  KEY `idx_patients_is_onboarded` (`is_onboarded`),
  KEY `idx_patients_current_session` (`current_session_id`),
  CONSTRAINT `fk_current_session` FOREIGN KEY (`current_session_id`) REFERENCES `patient_sessions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `patients_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: refresh_tokens
CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: smart_devices
CREATE TABLE `smart_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ambulance_id` int(11) NOT NULL,
  `device_id` varchar(100) NOT NULL,
  `device_type` enum('ecg','bp_monitor','pulse_oximeter','glucose_monitor','gps_tracker','temperature','ventilator') NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `last_sync` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_id` (`device_id`),
  KEY `idx_ambulance` (`ambulance_id`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `smart_devices_ibfk_1` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organization_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('superadmin','hospital_admin','hospital_staff','hospital_doctor','hospital_paramedic','fleet_admin','fleet_staff','fleet_doctor','fleet_paramedic') NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('pending_approval','active','inactive','suspended') DEFAULT 'pending_approval',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `created_by` (`created_by`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  KEY `idx_email` (`email`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: vital_signs
CREATE TABLE `vital_signs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `blood_pressure_systolic` int(11) DEFAULT NULL,
  `blood_pressure_diastolic` int(11) DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `respiratory_rate` int(11) DEFAULT NULL,
  `oxygen_saturation` int(11) DEFAULT NULL,
  `blood_glucose` int(11) DEFAULT NULL,
  `consciousness_level` enum('alert','verbal','pain','unresponsive') DEFAULT NULL,
  `pain_scale` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) NOT NULL,
  `recorded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `recorded_by` (`recorded_by`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_recorded_at` (`recorded_at`),
  CONSTRAINT `vital_signs_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vital_signs_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `patient_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vital_signs_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

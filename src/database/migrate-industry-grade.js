require('dotenv').config();
const db = require('../config/database');

/**
 * Industry-grade migration script for role-based access control enhancements
 * 
 * Changes:
 * 1. Add is_active to organizations table
 * 2. Add is_active to patients table
 * 3. Add disabled status to ambulances
 * 4. Create activity_logs table for audit trail
 * 5. Add duration column to partnerships if not exists
 */

async function migrateIndustryGrade() {
  console.log('🚀 Starting industry-grade migrations...\n');

  try {
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Add is_active to organizations table
      console.log('📋 Adding is_active column to organizations...');
      await connection.query(`
        ALTER TABLE organizations 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER status
      `);
      console.log('✅ Organizations is_active column added\n');

      // 2. Add is_active to patients table
      console.log('📋 Adding is_active column to patients...');
      await connection.query(`
        ALTER TABLE patients 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER created_by
      `);
      console.log('✅ Patients is_active column added\n');

      // 3. Update ambulances status enum to include 'disabled'
      console.log('📋 Updating ambulances status to include disabled...');
      // Check if disabled already exists
      const [ambulanceStatus] = await connection.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'ambulances' 
        AND COLUMN_NAME = 'status'
      `);
      
      if (ambulanceStatus[0] && !ambulanceStatus[0].COLUMN_TYPE.includes('disabled')) {
        await connection.query(`
          ALTER TABLE ambulances 
          MODIFY COLUMN status ENUM(
            'pending_approval', 
            'active', 
            'inactive', 
            'maintenance', 
            'available', 
            'on_trip', 
            'emergency',
            'disabled'
          ) DEFAULT 'pending_approval'
        `);
        console.log('✅ Ambulances status updated with disabled\n');
      } else {
        console.log('✅ Ambulances status already includes disabled\n');
      }

      // 4. Create activity_logs table
      console.log('📋 Creating activity_logs table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          activity VARCHAR(100) NOT NULL,
          comments TEXT NOT NULL,
          user_id INT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          organization_id INT,
          organization_name VARCHAR(255),
          metadata JSON,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
          INDEX idx_activity (activity),
          INDEX idx_user (user_id),
          INDEX idx_organization (organization_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Activity logs table created\n');

      // 5. Add duration to partnerships if not exists
      console.log('📋 Checking partnerships table for duration column...');
      const [partnershipCols] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'partnerships' 
        AND COLUMN_NAME = 'duration_months'
      `);
      
      if (partnershipCols.length === 0) {
        await connection.query(`
          ALTER TABLE partnerships 
          ADD COLUMN duration_months INT DEFAULT NULL AFTER status,
          ADD COLUMN start_date DATE DEFAULT NULL AFTER duration_months,
          ADD COLUMN end_date DATE DEFAULT NULL AFTER start_date,
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
        `);
        console.log('✅ Partnerships duration columns added\n');
      } else {
        console.log('✅ Partnerships duration column already exists\n');
      }

      // 6. Ensure ambulance_user_mappings exists for doctor/paramedic assignments
      console.log('📋 Ensuring ambulance_user_mappings table exists...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ambulance_user_mappings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          ambulance_id INT NOT NULL,
          user_id INT NOT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          assigned_by INT,
          status ENUM('active', 'inactive') DEFAULT 'active',
          FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE KEY unique_assignment (ambulance_id, user_id),
          INDEX idx_ambulance (ambulance_id),
          INDEX idx_user (user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Ambulance user mappings table ensured\n');

      // Commit transaction
      await connection.commit();
      console.log('🎉 All migrations completed successfully!\n');

    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateIndustryGrade()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateIndustryGrade;

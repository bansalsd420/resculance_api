const PatientSessionModel = require('../models/PatientSession');
const { AppError } = require('../middleware/auth');

class SessionController {
  /**
   * Get all sessions with metadata for viewing history
   * Accessible by all authenticated users based on their role
   */
  static async getAllSessions(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search,
        startDate,
        endDate,
        organizationId 
      } = req.query;

      const offset = (page - 1) * limit;
      const filters = {};

      // Apply role-based filtering
      if (req.user.role === 'superadmin') {
        // Superadmin can see all sessions, optionally filtered by organizationId
        if (organizationId) {
          filters.organizationId = organizationId;
        }
      } else {
        // Other users can only see sessions from their organization
        filters.organizationId = req.user.organizationId;
      }

      if (status) {
        filters.status = status;
      }

      // Build the query
      let query = `
        SELECT ps.*, 
               p.first_name as patient_first_name, 
               p.last_name as patient_last_name,
               a.ambulance_code, 
               a.registration_number,
               org.name as organization_name, 
               org.type as organization_type,
               dest_org.name as destination_hospital_name,
               onboarded_user.first_name as onboarded_by_first_name,
               onboarded_user.last_name as onboarded_by_last_name,
               offboarded_user.first_name as offboarded_by_first_name,
               offboarded_user.last_name as offboarded_by_last_name
        FROM patient_sessions ps
        JOIN patients p ON ps.patient_id = p.id
        JOIN ambulances a ON ps.ambulance_id = a.id
        JOIN organizations org ON ps.organization_id = org.id
        LEFT JOIN organizations dest_org ON ps.destination_hospital_id = dest_org.id
        LEFT JOIN users onboarded_user ON ps.onboarded_by = onboarded_user.id
        LEFT JOIN users offboarded_user ON ps.offboarded_by = offboarded_user.id
        WHERE 1=1
      `;

      const params = [];

      if (filters.organizationId) {
        query += ' AND ps.organization_id = ?';
        params.push(filters.organizationId);
      }

      if (filters.status) {
        query += ' AND ps.status = ?';
        params.push(filters.status);
      }

      if (search) {
        query += ' AND (ps.session_code LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ? OR a.ambulance_code LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (startDate) {
        query += ' AND ps.onboarded_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND ps.onboarded_at <= ?';
        params.push(endDate);
      }

      // Add ordering
      query += ' ORDER BY ps.onboarded_at DESC';

      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const db = require('../config/database');
      const [sessions] = await db.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM patient_sessions ps
        JOIN patients p ON ps.patient_id = p.id
        JOIN ambulances a ON ps.ambulance_id = a.id
        WHERE 1=1
      `;
      const countParams = [];

      if (filters.organizationId) {
        countQuery += ' AND ps.organization_id = ?';
        countParams.push(filters.organizationId);
      }

      if (filters.status) {
        countQuery += ' AND ps.status = ?';
        countParams.push(filters.status);
      }

      if (search) {
        countQuery += ' AND (ps.session_code LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ? OR a.ambulance_code LIKE ?)';
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (startDate) {
        countQuery += ' AND ps.onboarded_at >= ?';
        countParams.push(startDate);
      }

      if (endDate) {
        countQuery += ' AND ps.onboarded_at <= ?';
        countParams.push(endDate);
      }

      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single session with full metadata
   */
  static async getSessionMetadata(req, res, next) {
    try {
      const { sessionId } = req.params;

      const db = require('../config/database');
      const [sessions] = await db.query(
        `SELECT ps.*, 
                p.first_name as patient_first_name, 
                p.last_name as patient_last_name,
                a.ambulance_code, 
                a.registration_number,
                org.name as organization_name, 
                org.type as organization_type,
                dest_org.name as destination_hospital_name
         FROM patient_sessions ps
         JOIN patients p ON ps.patient_id = p.id
         JOIN ambulances a ON ps.ambulance_id = a.id
         JOIN organizations org ON ps.organization_id = org.id
         LEFT JOIN organizations dest_org ON ps.destination_hospital_id = dest_org.id
         WHERE ps.id = ?`,
        [sessionId]
      );

      if (!sessions || sessions.length === 0) {
        return next(new AppError('Session not found', 404));
      }

      const session = sessions[0];

      // Authorization check
      if (req.user.role !== 'superadmin') {
        // Check if user's organization is related to this session
        if (session.organization_id !== req.user.organizationId &&
            session.destination_hospital_id !== req.user.organizationId) {
          return next(new AppError('You do not have access to this session', 403));
        }
      }

      // Parse metadata if it exists
      if (session.session_metadata) {
        try {
          session.metadata = typeof session.session_metadata === 'string' 
            ? JSON.parse(session.session_metadata) 
            : session.session_metadata;
        } catch (e) {
          session.metadata = null;
        }
      }

      res.json({
        success: true,
        data: { session }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(req, res, next) {
    try {
      const db = require('../config/database');
      
      const filters = {};
      if (req.user.role !== 'superadmin') {
        filters.organizationId = req.user.organizationId;
      }

      let whereClause = '1=1';
      const params = [];

      if (filters.organizationId) {
        whereClause += ' AND organization_id = ?';
        params.push(filters.organizationId);
      }

      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN status = 'onboarded' THEN 1 ELSE 0 END) as onboarded,
          SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
          SUM(CASE WHEN status = 'offboarded' THEN 1 ELSE 0 END) as offboarded,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          AVG(duration_minutes) as avg_duration_minutes
        FROM patient_sessions
        WHERE ${whereClause}
      `, params);

      res.json({
        success: true,
        data: { stats: stats[0] }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SessionController;

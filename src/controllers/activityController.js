const ActivityLog = require('../models/ActivityLog');
const { hasPermission, PERMISSIONS } = require('../config/permissions');

/**
 * Activity Controller
 * Handles activity log operations
 */
class ActivityController {
  
  /**
   * Get all activity logs with filters
   * Only accessible to superadmins
   */
  static async getAll(req, res) {
    try {
      const {
        activity,
        userId,
        organizationId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 50
      } = req.query;

      const filters = {
        activity,
        userId: userId ? parseInt(userId) : undefined,
        organizationId: organizationId ? parseInt(organizationId) : undefined,
        startDate,
        endDate,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      // If the requesting user does not have permission to view full activity logs,
      // restrict results to their own organization. Superadmins (and any role with
      // VIEW_ACTIVITY_LOGS) will not be restricted.
      if (!hasPermission(req.user?.role, PERMISSIONS.VIEW_ACTIVITY_LOGS)) {
        // override any provided organizationId with the user's organization
        filters.organizationId = req.user?.organizationId;
      }

      const [activities, total] = await Promise.all([
        ActivityLog.findAll(filters),
        ActivityLog.count(filters)
      ]);

      res.json({
        activities,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit)
        }
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ 
        error: 'Failed to fetch activity logs',
        message: error.message 
      });
    }
  }

  /**
   * Get distinct activity types for filtering
   */
  static async getActivityTypes(req, res) {
    try {
      const activities = await ActivityLog.getDistinctActivities();
      res.json({ activities });
    } catch (error) {
      console.error('Error fetching activity types:', error);
      res.status(500).json({ 
        error: 'Failed to fetch activity types',
        message: error.message 
      });
    }
  }

  /**
   * Get distinct users for filtering
   */
  static async getUsers(req, res) {
    try {
      const users = await ActivityLog.getDistinctUsers();
      res.json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        message: error.message 
      });
    }
  }

  /**
   * Get activity log by ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const activity = await ActivityLog.findById(id);

      if (!activity) {
        return res.status(404).json({ error: 'Activity log not found' });
      }

      res.json({ activity });
    } catch (error) {
      console.error('Error fetching activity log:', error);
      res.status(500).json({ 
        error: 'Failed to fetch activity log',
        message: error.message 
      });
    }
  }
}

module.exports = ActivityController;

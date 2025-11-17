const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');
const { requireAnyPermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../middleware/permissions');

// Allow users who can view the dashboard to fetch recent activities for their org,
// while keeping the full activity log access restricted to users with VIEW_ACTIVITY_LOGS.
router.use(authenticate);
router.use(requireAnyPermission(PERMISSIONS.VIEW_ACTIVITY_LOGS, PERMISSIONS.VIEW_DASHBOARD));

// Get all activities with filters and pagination
router.get('/', ActivityController.getAll);

// Get distinct activity types for filtering
router.get('/types', ActivityController.getActivityTypes);

// Get distinct users for filtering
router.get('/users', ActivityController.getUsers);

// Get specific activity by ID
router.get('/:id', ActivityController.getById);

module.exports = router;

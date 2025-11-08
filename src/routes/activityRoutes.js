const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../middleware/permissions');

// All activity routes require authentication and superadmin role
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.VIEW_ACTIVITY_LOGS));

// Get all activities with filters and pagination
router.get('/', ActivityController.getAll);

// Get distinct activity types for filtering
router.get('/types', ActivityController.getActivityTypes);

// Get distinct users for filtering
router.get('/users', ActivityController.getUsers);

// Get specific activity by ID
router.get('/:id', ActivityController.getById);

module.exports = router;

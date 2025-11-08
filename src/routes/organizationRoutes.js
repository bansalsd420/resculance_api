const express = require('express');
const OrganizationController = require('../controllers/organizationController');
const { authenticate, authorize } = require('../middleware/auth');
const { createOrganizationValidation, validate } = require('../middleware/validation');
const { requirePermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create organization - only superadmin
router.post(
  '/',
  requirePermission(PERMISSIONS.CREATE_ORGANIZATION),
  createOrganizationValidation,
  validate,
  OrganizationController.create
);

// View organizations - superadmin can see all, others can see their own
router.get('/', OrganizationController.getAll);
router.get('/:id', OrganizationController.getById);

// Update organization - only superadmin
router.put(
  '/:id',
  requirePermission(PERMISSIONS.UPDATE_ORGANIZATION),
  OrganizationController.update
);

// Delete organization - only superadmin
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.DELETE_ORGANIZATION),
  OrganizationController.delete
);

router.patch(
  '/:id/deactivate',
  requirePermission(PERMISSIONS.UPDATE_ORGANIZATION),
  OrganizationController.deactivate
);

router.patch(
  '/:id/suspend',
  requirePermission(PERMISSIONS.UPDATE_ORGANIZATION),
  OrganizationController.suspend
);

router.patch(
  '/:id/activate',
  requirePermission(PERMISSIONS.UPDATE_ORGANIZATION),
  OrganizationController.activate
);

module.exports = router;

module.exports = router;

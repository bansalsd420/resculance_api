const express = require('express');
const OrganizationController = require('../controllers/organizationController');
const { authenticate, authorize } = require('../middleware/auth');
const { createOrganizationValidation, validate } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize(ROLES.SUPERADMIN),
  createOrganizationValidation,
  validate,
  OrganizationController.create
);

router.get('/', OrganizationController.getAll);
router.get('/:id', OrganizationController.getById);

router.put(
  '/:id',
  authorize(ROLES.SUPERADMIN),
  OrganizationController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN),
  OrganizationController.delete
);

router.patch(
  '/:id/suspend',
  authorize(ROLES.SUPERADMIN),
  OrganizationController.suspend
);

router.patch(
  '/:id/activate',
  authorize(ROLES.SUPERADMIN),
  OrganizationController.activate
);

module.exports = router;

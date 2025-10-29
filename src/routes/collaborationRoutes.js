const express = require('express');
const CollaborationController = require('../controllers/collaborationController');
const { authenticate, authorize, requireOrgType } = require('../middleware/auth');
const { createCollaborationRequestValidation, validate } = require('../middleware/validation');
const { ROLES, ORG_TYPES } = require('../config/constants');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  requireOrgType(ORG_TYPES.HOSPITAL),
  authorize(
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF
  ),
  createCollaborationRequestValidation,
  validate,
  CollaborationController.create
);

router.get('/', CollaborationController.getAll);
router.get('/:id', CollaborationController.getById);

router.patch(
  '/:id/accept',
  requireOrgType(ORG_TYPES.FLEET_OWNER),
  authorize(
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  CollaborationController.accept
);

router.patch(
  '/:id/reject',
  requireOrgType(ORG_TYPES.FLEET_OWNER),
  authorize(
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  CollaborationController.reject
);

router.patch(
  '/:id/cancel',
  requireOrgType(ORG_TYPES.HOSPITAL),
  authorize(
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF
  ),
  CollaborationController.cancel
);

module.exports = router;

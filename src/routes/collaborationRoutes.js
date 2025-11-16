const express = require('express');
const CollaborationController = require('../controllers/collaborationController');
const { authenticate, authorize, requireOrgType } = require('../middleware/auth');
const { createCollaborationRequestValidation, validate } = require('../middleware/validation');
const { ROLES, ORG_TYPES } = require('../config/constants');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Allow both hospital and fleet org users to create collaboration requests.
// The controller itself validates that non-superadmin users can only create
// requests from their own organization (hospital -> fleet, fleet -> hospital),
// so we only restrict by roles here and not by org type.
router.post(
  '/',
  authorize(
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  createCollaborationRequestValidation,
  validate,
  CollaborationController.create
);

router.get('/', CollaborationController.getAll);
router.get('/partnerships/my', CollaborationController.getMyPartnerships);
router.get('/:id', CollaborationController.getById);

router.patch(
  '/:id/accept',
  authorize(
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  CollaborationController.accept
);

router.patch(
  '/:id/reject',
  authorize(
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  CollaborationController.reject
);

router.patch(
  '/:id/cancel',
  authorize(
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  CollaborationController.cancel
);

module.exports = router;

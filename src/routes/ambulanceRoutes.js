const express = require('express');
const AmbulanceController = require('../controllers/ambulanceController');
const { authenticate, authorize, canAccessAmbulance } = require('../middleware/auth');
const { createAmbulanceValidation, validate } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  createAmbulanceValidation,
  validate,
  AmbulanceController.create
);

router.get('/', AmbulanceController.getAll);
router.get('/my-ambulances', AmbulanceController.getUserAmbulances);
router.get('/:id', AmbulanceController.getById);

router.put(
  '/:id',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  AmbulanceController.update
);

router.patch(
  '/:id/approve',
  authorize(ROLES.SUPERADMIN),
  AmbulanceController.approve
);

router.post(
  '/:id/assign',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  AmbulanceController.assignUser
);

router.delete(
  '/:id/unassign/:userId',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  AmbulanceController.unassignUser
);

router.get('/:id/assigned-users', AmbulanceController.getAssignedUsers);

router.post(
  '/:id/location',
  authorize(
    ROLES.HOSPITAL_PARAMEDIC,
    ROLES.FLEET_PARAMEDIC
  ),
  AmbulanceController.updateLocation
);

router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.HOSPITAL_ADMIN, ROLES.FLEET_ADMIN),
  AmbulanceController.delete
);

module.exports = router;

const express = require('express');
const UserController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { registerValidation, validate } = require('../middleware/validation');
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
  registerValidation,
  validate,
  UserController.create
);

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);

router.put('/:id', UserController.update);

router.patch(
  '/:id/approve',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.FLEET_ADMIN
  ),
  UserController.approve
);

router.patch(
  '/:id/suspend',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.FLEET_ADMIN
  ),
  UserController.suspend
);

router.delete(
  '/:id',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.FLEET_ADMIN
  ),
  UserController.delete
);

module.exports = router;

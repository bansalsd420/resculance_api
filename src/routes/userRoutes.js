const express = require('express');
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { registerValidation, validate } = require('../middleware/validation');
const { requirePermission, requireAnyPermission, canApproveUserRole } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  requirePermission(PERMISSIONS.CREATE_USER),
  registerValidation,
  validate,
  UserController.create
);

router.get('/', UserController.getAll);

router.get('/:id', UserController.getById);

router.put('/:id', requirePermission(PERMISSIONS.UPDATE_USER), UserController.update);

const uploadProfile = require('../middleware/multerProfile');

// Upload profile image for a specific user (admin/superadmin)
router.post('/:id/profile-image', requirePermission(PERMISSIONS.UPDATE_USER), uploadProfile.single('avatar'), UserController.uploadProfileImageForUser);

router.patch(
  '/:id/approve',
  requirePermission(PERMISSIONS.APPROVE_USER),
  canApproveUserRole,
  UserController.approve
);

router.patch(
  '/:id/suspend',
  requirePermission(PERMISSIONS.UPDATE_USER),
  UserController.suspend
);

router.patch(
  '/:id/activate',
  requirePermission(PERMISSIONS.UPDATE_USER),
  UserController.activate
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.DELETE_USER),
  UserController.delete
);

module.exports = router;

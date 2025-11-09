const express = require('express');
const PatientController = require('../controllers/patientController');
const { authenticate, authorize, canAccessPatient } = require('../middleware/auth');
const { createPatientValidation, onboardPatientValidation, validate } = require('../middleware/validation');
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
    ROLES.HOSPITAL_PARAMEDIC,
    ROLES.HOSPITAL_DOCTOR,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF,
    ROLES.FLEET_PARAMEDIC
  ),
  createPatientValidation,
  validate,
  PatientController.create
);

router.get('/', PatientController.getAll);
router.get('/code/:code', PatientController.getByCode);

router.put(
  '/:id',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  PatientController.update
);

router.patch(
  '/:id/hide-data',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  PatientController.hideData
);

router.patch(
  '/:id/unhide-data',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  PatientController.unhideData
);

router.delete(
  '/:id',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF
  ),
  PatientController.delete
);

// Patient session routes
router.post(
  '/:patientId/onboard',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.HOSPITAL_PARAMEDIC,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF,
    ROLES.FLEET_PARAMEDIC
  ),
  onboardPatientValidation,
  validate,
  PatientController.onboard
);

router.patch(
  '/sessions/:sessionId/offboard',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_STAFF,
    ROLES.HOSPITAL_PARAMEDIC,
    ROLES.HOSPITAL_DOCTOR,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_STAFF,
    ROLES.FLEET_PARAMEDIC,
    ROLES.FLEET_DOCTOR
  ),
  PatientController.offboard
);

router.get('/sessions', PatientController.getSessions);
router.get('/sessions/:sessionId', PatientController.getSession);
router.get('/:patientId/sessions', PatientController.getPatientSessions);

router.post(
  '/:patientId/vital-signs',
  authorize(
    ROLES.HOSPITAL_PARAMEDIC,
    ROLES.HOSPITAL_DOCTOR,
    ROLES.FLEET_PARAMEDIC,
    ROLES.FLEET_DOCTOR
  ),
  PatientController.addVitalSigns
);

router.get(
  '/:patientId/vital-signs',
  PatientController.getVitalSigns
);

router.post(
  '/:patientId/communications',
  authorize(
    ROLES.HOSPITAL_PARAMEDIC,
    ROLES.HOSPITAL_DOCTOR,
    ROLES.FLEET_PARAMEDIC,
    ROLES.FLEET_DOCTOR
  ),
  PatientController.addCommunication
);

// Session-based group chat routes
router.get(
  '/sessions/:sessionId/messages',
  PatientController.getSessionMessages
);

router.post(
  '/sessions/:sessionId/messages',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.HOSPITAL_PARAMEDIC,
    ROLES.HOSPITAL_DOCTOR,
    ROLES.HOSPITAL_STAFF,
    ROLES.FLEET_ADMIN,
    ROLES.FLEET_PARAMEDIC,
    ROLES.FLEET_DOCTOR,
    ROLES.FLEET_STAFF,
    ROLES.FLEET_DRIVER
  ),
  PatientController.sendSessionMessage
);

router.patch(
  '/messages/:messageId/read',
  PatientController.markMessageAsRead
);

router.get(
  '/sessions/:sessionId/unread-count',
  PatientController.getUnreadCount
);

module.exports = router;

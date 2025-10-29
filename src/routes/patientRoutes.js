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
  '/:patientId/offboard',
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

router.get('/:patientId/sessions', PatientController.getSessions);
router.get('/:patientId/sessions/:sessionId', PatientController.getSession);

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

module.exports = router;

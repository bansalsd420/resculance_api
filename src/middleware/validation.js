const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }
  next();
};

// Auth validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('organizationId').isInt().withMessage('Valid organization ID is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Organization validation rules
const createOrganizationValidation = [
  body('name').trim().notEmpty().withMessage('Organization name is required'),
  body('type').isIn(['HOSPITAL', 'FLEET_OWNER']).withMessage('Invalid organization type'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
];

// Ambulance validation rules
const createAmbulanceValidation = [
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
  body('vehicleModel').optional().trim(),
  body('vehicleType').optional().trim(),
  body('organizationId').isInt().withMessage('Valid organization ID is required')
];

// Patient validation rules
const createPatientValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('bloodGroup').optional().trim(),
  body('contactPhone').optional().trim()
];

// Patient session validation rules
const onboardPatientValidation = [
  body('ambulanceId').isInt().withMessage('Valid ambulance ID is required'),
  body('destinationHospitalId').isInt().withMessage('Valid destination hospital ID is required'),
  body('chiefComplaint').optional().trim(),
  body('pickupLocation').optional().trim()
];

// Collaboration request validation rules
const createCollaborationRequestValidation = [
  body('fleetOwnerId').isInt().withMessage('Fleet owner ID is required'),
  body('message').optional().trim()
];

// ID param validation
const idParamValidation = [
  param('id').isInt().withMessage('Valid ID is required')
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createOrganizationValidation,
  createAmbulanceValidation,
  createPatientValidation,
  onboardPatientValidation,
  createCollaborationRequestValidation,
  idParamValidation
};

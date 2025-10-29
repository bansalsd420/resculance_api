const jwt = require('jsonwebtoken');
const db = require('../config/database');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const [users] = await db.query(
      `SELECT u.*, o.type as org_type, o.code as org_code, o.name as org_name, o.status as org_status
       FROM users u
       JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.id]
    );

    if (users.length === 0) {
      return next(new AppError('The user belonging to this token no longer exists or is inactive.', 401));
    }

    const user = users[0];

    // Check if organization is active
    if (user.org_status !== 'active') {
      return next(new AppError('Your organization is currently inactive. Please contact support.', 403));
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      organizationId: user.organization_id,
      organizationType: user.org_type,
      organizationCode: user.org_code,
      organizationName: user.org_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Superadmin can access all endpoints
    if (req.user.role === 'superadmin') {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

// Check if user belongs to specific organization type
const requireOrgType = (...orgTypes) => {
  return (req, res, next) => {
    if (!orgTypes.includes(req.user.organizationType)) {
      return next(
        new AppError('This action is not available for your organization type.', 403)
      );
    }
    next();
  };
};

// Check if user can manage a specific organization
const canManageOrganization = async (req, res, next) => {
  try {
    const targetOrgId = req.params.orgId || req.params.organizationId || req.body.organizationId;
    
    // Superadmin can manage any organization
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Users can only manage their own organization
    if (parseInt(targetOrgId) !== req.user.organizationId) {
      return next(new AppError('You can only manage your own organization.', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can access specific ambulance
const canAccessAmbulance = async (req, res, next) => {
  try {
    const ambulanceId = req.params.ambulanceId || req.body.ambulanceId;
    
    if (!ambulanceId) {
      return next(new AppError('Ambulance ID is required.', 400));
    }

    // Superadmin can access any ambulance
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if ambulance belongs to user's organization or is mapped to user
    const [ambulances] = await db.query(
      `SELECT a.* FROM ambulances a
       LEFT JOIN ambulance_user_mappings aum ON a.id = aum.ambulance_id AND aum.user_id = ?
       WHERE a.id = ? AND (a.organization_id = ? OR aum.id IS NOT NULL)`,
      [req.user.id, ambulanceId, req.user.organizationId]
    );

    if (ambulances.length === 0) {
      return next(new AppError('You do not have access to this ambulance.', 403));
    }

    req.ambulance = ambulances[0];
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can access patient data
const canAccessPatient = async (req, res, next) => {
  try {
    const patientCode = req.params.patientCode || req.body.patientCode;
    
    if (!patientCode) {
      return next(new AppError('Patient code is required.', 400));
    }

    // Superadmin can access any patient
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Get patient data
    const [patients] = await db.query(
      `SELECT p.* FROM patients p
       JOIN patient_sessions ps ON p.id = ps.patient_id
       WHERE p.patient_code = ? AND ps.hospital_id = ?
       LIMIT 1`,
      [patientCode, req.user.organizationId]
    );

    if (patients.length === 0) {
      return next(new AppError('Patient not found or you do not have access.', 404));
    }

    const patient = patients[0];

    // Check if data is hidden
    if (patient.is_data_hidden && !['hospital_admin', 'hospital_staff', 'fleet_admin', 'fleet_staff'].includes(req.user.role)) {
      return next(new AppError('Access to this patient data is restricted.', 403));
    }

    req.patient = patient;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  requireOrgType,
  canManageOrganization,
  canAccessAmbulance,
  canAccessPatient,
  AppError
};

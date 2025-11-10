const { hasPermission, canApproveRole, PERMISSIONS } = require('../config/permissions');
const { AppError } = require('./auth');

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the required permissions
 * @param {...string} permissions - Array of permissions (OR logic)
 */
const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const hasAny = permissions.some(permission => 
      hasPermission(req.user.role, permission)
    );

    if (!hasAny) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Middleware to check if user has all required permissions
 * @param {...string} permissions - Array of permissions (AND logic)
 */
const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const hasAll = permissions.every(permission => 
      hasPermission(req.user.role, permission)
    );

    if (!hasAll) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Middleware to restrict access to own organization only
 * Superadmin can access all organizations
 */
const restrictToOwnOrganization = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Superadmin can access any organization
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Get the organization ID from various possible sources
  const targetOrgId = 
    req.params.organizationId || 
    req.params.orgId ||
    req.body.organizationId ||
    req.query.organizationId;

  // If checking a specific organization, ensure it matches user's org
  if (targetOrgId && parseInt(targetOrgId) !== req.user.organizationId) {
    return next(new AppError('Access denied: You can only access your own organization', 403));
  }

  next();
};

/**
 * Middleware to check if user can approve a specific user role
 */
const canApproveUserRole = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Try to get the target user's role from request body first
    let targetRole = req.body.role || req.targetUser?.role;
    const approverRole = req.user.role;

    // If not provided, attempt to load the user from DB using the :id route param
    if (!targetRole) {
      const userId = req.params?.id;
      if (!userId) {
        return next(new AppError('Target user role not found', 400));
      }
      // Lazy-require to avoid circular deps at module load time
      const UserModel = require('../models/User');
      const targetUser = await UserModel.findById(userId);
      if (!targetUser) return next(new AppError('Target user not found', 404));
      // attach to request for downstream handlers
      req.targetUser = targetUser;
      targetRole = targetUser.role;
    }

    // Normalize for logging and decision
    const a = approverRole ? String(approverRole).toLowerCase() : '';
    const t = targetRole ? String(targetRole).toLowerCase() : '';

    // Debug trace to help diagnose permission issues during testing
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[canApproveUserRole] approver=', a, 'target=', t);
    }

    if (!canApproveRole(a, t)) {
      return next(new AppError('You cannot approve users with this role', 403));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  restrictToOwnOrganization,
  canApproveUserRole,
  PERMISSIONS
};

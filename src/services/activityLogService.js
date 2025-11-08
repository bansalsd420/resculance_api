const ActivityLog = require('../models/ActivityLog');
const { ACTIVITY_TYPES } = require('../config/constants');

/**
 * Activity Logging Service
 * Centralized service for logging all system activities
 */
class ActivityLogService {
  
  /**
   * Log an activity
   * @param {Object} params - Activity parameters
   * @returns {Promise<number>} - Activity log ID
   */
  static async log({
    activity,
    comments,
    user,
    organization = null,
    metadata = null,
    req = null
  }) {
    try {
      const logData = {
        activity,
        comments,
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        organizationId: organization?.id || null,
        organizationName: organization?.name || null,
        metadata,
        ipAddress: req ? this.getClientIp(req) : null,
        userAgent: req ? req.headers['user-agent'] : null
      };

      return await ActivityLog.create(logData);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging failure shouldn't break the main operation
      return null;
    }
  }

  /**
   * Log organization created
   */
  static async logOrgCreated(user, organization, req) {
    return this.log({
      activity: ACTIVITY_TYPES.ORG_CREATED,
      comments: `Organization created: ${organization.name} (${organization.type})`,
      user,
      organization,
      metadata: { organizationType: organization.type },
      req
    });
  }

  /**
   * Log organization deactivated
   */
  static async logOrgDeactivated(user, organization, req) {
    return this.log({
      activity: ACTIVITY_TYPES.ORG_DEACTIVATED,
      comments: `Organization deactivated: ${organization.name}`,
      user,
      organization,
      req
    });
  }

  /**
   * Log organization activated
   */
  static async logOrgActivated(user, organization, req) {
    return this.log({
      activity: ACTIVITY_TYPES.ORG_ACTIVATED,
      comments: `Organization activated: ${organization.name}`,
      user,
      organization,
      req
    });
  }

  /**
   * Log organization updated
   */
  static async logOrgUpdated(user, organization, changes, req) {
    return this.log({
      activity: ACTIVITY_TYPES.ORG_UPDATED,
      comments: `Organization updated: ${organization.name}`,
      user,
      organization,
      metadata: { changes },
      req
    });
  }

  /**
   * Log partnership requested
   */
  static async logPartnershipRequested(user, fleetOrg, hospitalOrg, req) {
    return this.log({
      activity: ACTIVITY_TYPES.PARTNERSHIP_REQUESTED,
      comments: `Partnership requested between ${fleetOrg.name} and ${hospitalOrg.name}`,
      user,
      organization: user.organization_id === fleetOrg.id ? fleetOrg : hospitalOrg,
      metadata: {
        fleetId: fleetOrg.id,
        fleetName: fleetOrg.name,
        hospitalId: hospitalOrg.id,
        hospitalName: hospitalOrg.name
      },
      req
    });
  }

  /**
   * Log partnership accepted
   */
  static async logPartnershipAccepted(user, fleetOrg, hospitalOrg, req) {
    return this.log({
      activity: ACTIVITY_TYPES.PARTNERSHIP_ACCEPTED,
      comments: `Partnership accepted between ${fleetOrg.name} and ${hospitalOrg.name}`,
      user,
      organization: user.organization_id === fleetOrg.id ? fleetOrg : hospitalOrg,
      metadata: {
        fleetId: fleetOrg.id,
        fleetName: fleetOrg.name,
        hospitalId: hospitalOrg.id,
        hospitalName: hospitalOrg.name
      },
      req
    });
  }

  /**
   * Log partnership rejected
   */
  static async logPartnershipRejected(user, fleetOrg, hospitalOrg, req) {
    return this.log({
      activity: ACTIVITY_TYPES.PARTNERSHIP_REJECTED,
      comments: `Partnership rejected between ${fleetOrg.name} and ${hospitalOrg.name}`,
      user,
      organization: user.organization_id === fleetOrg.id ? fleetOrg : hospitalOrg,
      metadata: {
        fleetId: fleetOrg.id,
        fleetName: fleetOrg.name,
        hospitalId: hospitalOrg.id,
        hospitalName: hospitalOrg.name
      },
      req
    });
  }

  /**
   * Log partnership cancelled
   */
  static async logPartnershipCancelled(user, fleetOrg, hospitalOrg, req) {
    return this.log({
      activity: ACTIVITY_TYPES.PARTNERSHIP_CANCELLED,
      comments: `Partnership cancelled between ${fleetOrg.name} and ${hospitalOrg.name}`,
      user,
      organization: user.organization_id === fleetOrg.id ? fleetOrg : hospitalOrg,
      metadata: {
        fleetId: fleetOrg.id,
        fleetName: fleetOrg.name,
        hospitalId: hospitalOrg.id,
        hospitalName: hospitalOrg.name
      },
      req
    });
  }

  /**
   * Get client IP address from request
   */
  static getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           null;
  }
}

module.exports = ActivityLogService;

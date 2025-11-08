const NotificationModel = require('../models/Notification');
const UserModel = require('../models/User');
const { emitNotification, emitBulkNotifications } = require('../socket/socketHandler');

class NotificationService {
  // Create notification for a single user
  static async createNotification(userId, type, title, message, data = null) {
    try {
      const id = await NotificationModel.create({
        userId,
        type,
        title,
        message,
        data
      });
      const notification = { id, userId, type, title, message, data, is_read: false, created_at: new Date() };
      
      // Emit real-time notification
      emitNotification(userId, notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notifications for multiple users
  static async createBulkNotifications(notifications) {
    try {
      await NotificationModel.createMultiple(notifications);
      
      // Emit real-time notifications
      const notificationsWithMeta = notifications.map(n => ({
        ...n,
        is_read: false,
        created_at: new Date()
      }));
      emitBulkNotifications(notificationsWithMeta);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // SUPERADMIN NOTIFICATIONS

  static async notifySuperadminsPartnershipAccepted(collaborationData) {
    const superadmins = await UserModel.findByRole('superadmin');
    const notifications = superadmins.map(admin => ({
      userId: admin.id,
      type: 'partnership_accepted',
      title: 'Partnership Request Accepted',
      message: `${collaborationData.requesterOrgName} accepted partnership with ${collaborationData.recipientOrgName}`,
      data: { collaborationId: collaborationData.id }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }

  static async notifySuperadminsNewAmbulance(ambulanceData) {
    const superadmins = await UserModel.findByRole('superadmin');
    const notifications = superadmins.map(admin => ({
      userId: admin.id,
      type: 'new_ambulance',
      title: 'New Ambulance Created',
      message: `New ambulance ${ambulanceData.ambulance_code} created by ${ambulanceData.organizationName}`,
      data: { ambulanceId: ambulanceData.id }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }

  static async notifySuperadminsNewAdmin(userData) {
    const superadmins = await UserModel.findByRole('superadmin');
    const notifications = superadmins.map(admin => ({
      userId: admin.id,
      type: 'new_admin_account',
      title: 'New Admin Account Created',
      message: `New ${userData.role} account created: ${userData.firstName} ${userData.lastName} at ${userData.organizationName}`,
      data: { userId: userData.id }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }

  // ADMIN NOTIFICATIONS

  static async notifyAdminsCollaborationRequest(adminOrgId, collaborationData) {
    const admins = await UserModel.findAdminsByOrganization(adminOrgId);
    const notifications = admins.map(admin => ({
      userId: admin.id,
      type: 'collaboration_request',
      title: 'New Partnership Request',
      message: `${collaborationData.requesterOrgName} sent a partnership request`,
      data: { collaborationId: collaborationData.id }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }

  static async notifyAdminsCollaborationAccepted(adminOrgId, collaborationData) {
    const admins = await UserModel.findAdminsByOrganization(adminOrgId);
    const notifications = admins.map(admin => ({
      userId: admin.id,
      type: 'collaboration_accepted',
      title: 'Partnership Request Accepted',
      message: `${collaborationData.recipientOrgName} accepted your partnership request`,
      data: { collaborationId: collaborationData.id }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }

  static async notifyAdminUserApproved(adminOrgId, userData) {
    const admins = await UserModel.findAdminsByOrganization(adminOrgId);
    const notifications = admins.map(admin => ({
      userId: admin.id,
      type: 'user_approved',
      title: 'User Account Approved',
      message: `${userData.firstName} ${userData.lastName} (${userData.role}) has been approved`,
      data: { userId: userData.id }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }

  static async notifyAdminAmbulanceApproved(adminOrgId, ambulanceData) {
    const admins = await UserModel.findAdminsByOrganization(adminOrgId);
    const notifications = admins.map(admin => ({
      userId: admin.id,
      type: 'ambulance_approved',
      title: 'Ambulance Approved',
      message: `Ambulance ${ambulanceData.ambulance_code} has been approved by superadmin`,
      data: { ambulanceId: ambulanceData.id }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }

  // DOCTOR/PARAMEDIC NOTIFICATIONS

  static async notifyUserAmbulanceAssignment(userId, ambulanceData) {
    await this.createNotification(
      userId,
      'ambulance_assigned',
      'Assigned to Ambulance',
      `You have been assigned to ambulance ${ambulanceData.ambulance_code}`,
      { ambulanceId: ambulanceData.id }
    );
  }

  static async notifyAmbulanceCrewPatientOnboarded(ambulanceId, patientData) {
    // Get all users assigned to this ambulance
    const assignedUsers = await UserModel.findByAmbulanceId(ambulanceId);
    const notifications = assignedUsers.map(user => ({
      userId: user.id,
      type: 'patient_onboarded',
      title: 'New Patient Onboarded',
      message: `Patient ${patientData.firstName} ${patientData.lastName} has been onboarded to your ambulance`,
      data: { 
        sessionId: patientData.sessionId,
        patientId: patientData.patientId,
        ambulanceId: ambulanceId
      }
    }));
    await this.createBulkNotifications(notifications);
    return notifications;
  }
}

module.exports = NotificationService;

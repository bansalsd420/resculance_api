const NotificationModel = require('../models/Notification');

class NotificationController {
  // Get all notifications for the logged-in user
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;

      const notifications = await NotificationModel.findByUserId(userId, limit);
      res.json({ notifications });
    } catch (error) {
      next(error);
    }
  }

  // Get unread notifications
  static async getUnreadNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const notifications = await NotificationModel.findUnreadByUserId(userId);
      res.json({ notifications });
    } catch (error) {
      next(error);
    }
  }

  // Get unread count
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await NotificationModel.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  // Mark notification as read
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await NotificationModel.markAsRead(id, userId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      await NotificationModel.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  // Delete a notification
  static async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await NotificationModel.deleteById(id, userId);
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Delete all notifications
  static async deleteAllNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      await NotificationModel.deleteAllForUser(userId);
      res.json({ message: 'All notifications deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;

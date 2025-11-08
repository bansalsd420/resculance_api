const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get all notifications for logged-in user
router.get('/', NotificationController.getNotifications);

// GET /api/notifications/unread - Get unread notifications
router.get('/unread', NotificationController.getUnreadNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// PATCH /api/notifications/mark-all-read - Mark all as read
router.patch('/mark-all-read', NotificationController.markAllAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', NotificationController.deleteNotification);

// DELETE /api/notifications - Delete all notifications
router.delete('/', NotificationController.deleteAllNotifications);

module.exports = router;

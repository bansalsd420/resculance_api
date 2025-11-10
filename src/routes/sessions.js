const express = require('express');
const SessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All session routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/sessions
 * @desc    Get all sessions with pagination and filters
 * @access  Private (All authenticated users - filtered by role)
 */
router.get('/', SessionController.getAllSessions);

/**
 * @route   GET /api/v1/sessions/stats
 * @desc    Get session statistics
 * @access  Private (All authenticated users - filtered by role)
 */
router.get('/stats', SessionController.getSessionStats);

/**
 * @route   GET /api/v1/sessions/:sessionId
 * @desc    Get a single session with full metadata
 * @access  Private (All authenticated users - authorization check inside controller)
 */
router.get('/:sessionId', SessionController.getSessionMetadata);

module.exports = router;

const express = require('express');
const SessionController = require('../controllers/sessionController');
const SessionDataController = require('../controllers/sessionDataController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/multerSessionFiles');

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

// ============ Session Data Routes (Notes, Medications, Files) ============

/**
 * @route   POST /api/v1/sessions/:sessionId/data
 * @desc    Add session data (note or medication)
 * @access  Private (Crew members of active session)
 */
router.post('/:sessionId/data', SessionDataController.addData);

/**
 * @route   POST /api/v1/sessions/:sessionId/data/upload
 * @desc    Upload file for a session
 * @access  Private (Crew members of active session)
 */
router.post('/:sessionId/data/upload', upload.single('file'), SessionDataController.uploadFile);

/**
 * @route   GET /api/v1/sessions/:sessionId/data
 * @desc    Get all session data (notes, medications, files)
 * @access  Private (All authenticated users)
 */
router.get('/:sessionId/data', SessionDataController.getAllData);

/**
 * @route   GET /api/v1/sessions/:sessionId/data/:type
 * @desc    Get session data by type (note, medication, or file)
 * @access  Private (All authenticated users)
 */
router.get('/:sessionId/data/:type', SessionDataController.getDataByType);

/**
 * @route   DELETE /api/v1/sessions/:sessionId/data/:dataId
 * @desc    Delete a session data entry
 * @access  Private (Owner, Admin, or Superadmin)
 */
router.delete('/:sessionId/data/:dataId', SessionDataController.deleteData);

/**
 * @route   GET /api/v1/sessions/:sessionId/data/files/:dataId/download
 * @desc    Download a session file
 * @access  Private (All authenticated users)
 */
router.get('/:sessionId/data/files/:dataId/download', SessionDataController.downloadFile);

module.exports = router;

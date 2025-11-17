const PatientSessionDataModel = require('../models/PatientSessionData');
const PatientSessionModel = require('../models/PatientSession');
const { AppError } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

/**
 * Session Data Controller
 * Handles real-time notes, medications, and file uploads during patient sessions
 */
class SessionDataController {
  /**
   * Add session data (note, medication, or file)
   * POST /api/v1/sessions/:sessionId/data
   */
  static async addData(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { dataType, content } = req.body;
      const userId = req.user.id;

      // Validate session exists and is active
      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Only allow data addition for active sessions
      const activeStatuses = ['onboarded', 'in_transit', 'active'];
      if (!activeStatuses.includes(session.status?.toLowerCase())) {
        throw new AppError('Can only add data to active sessions', 400);
      }

      // Validate data type
      const validTypes = ['note', 'medication', 'file'];
      if (!validTypes.includes(dataType)) {
        throw new AppError('Invalid data type. Must be: note, medication, or file', 400);
      }

      // Create the data entry
      const sessionData = await PatientSessionDataModel.create(
        sessionId,
        dataType,
        content,
        userId
      );

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      if (io) {
        console.log(`[SessionData] Emitting session_data_added for session ${sessionId}`);
        io.to(`session_${sessionId}`).emit('session_data_added', {
          sessionId: parseInt(sessionId), // Ensure it's a number
          data: sessionData
        });
      }

      res.status(201).json({
        success: true,
        message: `${dataType} added successfully`,
        data: sessionData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload file for a session
   * POST /api/v1/sessions/:sessionId/data/upload
   */
  static async uploadFile(req, res, next) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // Validate session exists and is active
      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        // Delete uploaded file if session doesn't exist
        fs.unlinkSync(file.path);
        throw new AppError('Session not found', 404);
      }

      const activeStatuses = ['onboarded', 'in_transit', 'active'];
      if (!activeStatuses.includes(session.status?.toLowerCase())) {
        // Delete uploaded file if session is not active
        fs.unlinkSync(file.path);
        throw new AppError('Can only upload files to active sessions', 400);
      }

      // Create file metadata
      const fileContent = {
        filename: file.originalname,
        filepath: file.path,
        relativePath: `/uploads/session-files/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      // Save to database
      const sessionData = await PatientSessionDataModel.create(
        sessionId,
        'file',
        fileContent,
        userId
      );

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      if (io) {
        console.log(`[SessionData] Emitting session_data_added for file upload in session ${sessionId}`);
        io.to(`session_${sessionId}`).emit('session_data_added', {
          sessionId: parseInt(sessionId), // Ensure it's a number
          data: sessionData
        });
      }

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: sessionData
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  /**
   * Get all session data
   * GET /api/v1/sessions/:sessionId/data
   */
  static async getAllData(req, res, next) {
    try {
      const { sessionId } = req.params;

      // Validate session exists
      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Get grouped data (notes, medications, files)
      const data = await PatientSessionDataModel.getGroupedData(sessionId);

      // Get counts
      const counts = await PatientSessionDataModel.countByType(sessionId);

      res.json({
        success: true,
        data: {
          ...data,
          counts
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get session data by type
   * GET /api/v1/sessions/:sessionId/data/:type
   */
  static async getDataByType(req, res, next) {
    try {
      const { sessionId, type } = req.params;

      // Validate session exists
      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Validate type
      const validTypes = ['note', 'medication', 'file'];
      if (!validTypes.includes(type)) {
        throw new AppError('Invalid data type. Must be: note, medication, or file', 400);
      }

      // Get filtered data
      const data = await PatientSessionDataModel.findBySessionAndType(sessionId, type);

      res.json({
        success: true,
        data: {
          type,
          items: data,
          count: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete session data entry
   * DELETE /api/v1/sessions/:sessionId/data/:dataId
   */
  static async deleteData(req, res, next) {
    try {
      const { sessionId, dataId } = req.params;
      const userId = req.user.id;

      // Validate session exists
      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Get the data entry to check ownership and delete files
      const dataEntry = await PatientSessionDataModel.findById(dataId);
      if (!dataEntry) {
        throw new AppError('Data entry not found', 404);
      }

      // Check if user is the one who added it or has admin role
      const isSuperadmin = req.user.role === 'superadmin';
      const isAdmin = req.user.role?.includes('admin');
      const isOwner = dataEntry.addedBy.id === userId;

      if (!isSuperadmin && !isAdmin && !isOwner) {
        throw new AppError('You can only delete your own entries', 403);
      }

      // If it's a file, delete the physical file
      if (dataEntry.dataType === 'file' && dataEntry.content.filepath) {
        try {
          if (fs.existsSync(dataEntry.content.filepath)) {
            fs.unlinkSync(dataEntry.content.filepath);
          }
        } catch (err) {
          console.error('Error deleting file:', err);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete from database
      await PatientSessionDataModel.delete(dataId, userId);

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`session_${sessionId}`).emit('session_data_deleted', {
          sessionId,
          dataId
        });
      }

      res.json({
        success: true,
        message: 'Data entry deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download session file
   * GET /api/v1/sessions/:sessionId/data/files/:dataId/download
   */
  static async downloadFile(req, res, next) {
    try {
      const { dataId } = req.params;

      // Get the data entry
      const dataEntry = await PatientSessionDataModel.findById(dataId);
      if (!dataEntry) {
        throw new AppError('File not found', 404);
      }

      if (dataEntry.dataType !== 'file') {
        throw new AppError('This entry is not a file', 400);
      }

      const filepath = dataEntry.content.filepath;
      if (!fs.existsSync(filepath)) {
        throw new AppError('File not found on server', 404);
      }

      // Send file for download
      res.download(filepath, dataEntry.content.filename);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SessionDataController;

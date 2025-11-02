const PatientModel = require('../models/Patient');
const PatientSessionModel = require('../models/PatientSession');
const AmbulanceModel = require('../models/Ambulance');
const VitalSignModel = require('../models/VitalSign');
const CommunicationModel = require('../models/Communication');
const { AppError } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Helper function to map snake_case to camelCase
const mapPatientFields = (patient) => {
  if (!patient) return null;
  return {
    ...patient,
    firstName: patient.first_name,
    lastName: patient.last_name,
    dateOfBirth: patient.date_of_birth,
    bloodGroup: patient.blood_group,
    contactPhone: patient.contact_phone,
    emergencyContactName: patient.emergency_contact_name,
    emergencyContactPhone: patient.emergency_contact_phone,
    emergencyContactRelation: patient.emergency_contact_relation,
    medicalHistory: patient.medical_history,
    currentMedications: patient.current_medications,
    isDataHidden: patient.is_data_hidden,
    hiddenBy: patient.hidden_by,
    hiddenAt: patient.hidden_at,
    createdAt: patient.created_at,
    updatedAt: patient.updated_at,
    patientCode: patient.patient_code
  };
};

class PatientController {
  static async create(req, res, next) {
    try {
      const {
        firstName, lastName, age, gender, bloodGroup, contactPhone,
        emergencyContactName, emergencyContactPhone, address,
        medicalHistory, allergies, currentMedications
      } = req.body;

      const patientCode = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const patientId = await PatientModel.create({
        patientCode,
        firstName,
        lastName,
        age,
        gender,
        bloodGroup,
        contactPhone,
        emergencyContactName,
        emergencyContactPhone,
        address,
        medicalHistory,
        allergies,
        currentMedications
      });

      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: { patientId, patientCode }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { search, limit = 50, offset = 0 } = req.query;

      const filters = { search, limit, offset };
      const patients = await PatientModel.findAll(filters);
      const total = await PatientModel.count({ search });

      // Map snake_case to camelCase for frontend
      const mappedPatients = patients.map(mapPatientFields);

      res.json({
        success: true,
        data: {
          patients: mappedPatients,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + patients.length) < total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCode(req, res, next) {
    try {
      const { code } = req.params;

      const patient = await PatientModel.findByCode(code);
      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }

      // Check if data is hidden and user has permission to view
      if (patient.is_data_hidden && !['hospital_admin', 'hospital_staff', 'fleet_admin', 'fleet_staff', 'superadmin'].includes(req.user.role)) {
        return next(new AppError('Access to this patient data is restricted', 403));
      }

      res.json({
        success: true,
        data: { patient: mapPatientFields(patient) }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const patient = await PatientModel.findById(id);
      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }

      await PatientModel.update(id, updateData);

      res.json({
        success: true,
        message: 'Patient updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async hideData(req, res, next) {
    try {
      const { id } = req.params;

      await PatientModel.hideData(id, req.user.id);

      res.json({
        success: true,
        message: 'Patient data hidden successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async unhideData(req, res, next) {
    try {
      const { id } = req.params;

      await PatientModel.unhideData(id);

      res.json({
        success: true,
        message: 'Patient data unhidden successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async onboard(req, res, next) {
    try {
      const { patientId } = req.params; // Get from URL parameter
      const {
        ambulanceId,
        pickupLocation, pickupLatitude, pickupLongitude,
        destinationLocation, destinationLatitude, destinationLongitude,
        destinationHospitalId, chiefComplaint, initialAssessment
      } = req.body;

      // Check if ambulance is available
      const ambulance = await AmbulanceModel.findById(ambulanceId);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      if (!['active', 'available'].includes(ambulance.status)) {
        return next(new AppError('Ambulance is not available', 400));
      }

      // Check if ambulance already has an active session
      const activeSession = await PatientSessionModel.findActiveByAmbulance(ambulanceId);
      if (activeSession) {
        return next(new AppError('Ambulance already has an active patient session', 400));
      }

      const sessionCode = `SES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const sessionId = await PatientSessionModel.create({
        sessionCode,
        patientId,
        ambulanceId,
        organizationId: req.user.organizationId, // The hospital initiating the trip
        destinationHospitalId: destinationHospitalId || req.user.organizationId,
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        destinationLocation,
        destinationLatitude,
        destinationLongitude,
        chiefComplaint,
        initialAssessment,
        onboardedBy: req.user.id,
        status: 'onboarded'
      });

      // Update ambulance status
      await AmbulanceModel.update(ambulanceId, {
        status: 'active',
        current_hospital_id: req.user.organizationId
      });

      // Emit socket event
      const io = req.app.get('io');
      io.to(`ambulance_${ambulanceId}`).emit('patient_onboarded', { sessionId, sessionCode });

      res.status(201).json({
        success: true,
        message: 'Patient onboarded successfully',
        data: { sessionId, sessionCode }
      });
    } catch (error) {
      next(error);
    }
  }

  static async offboard(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { treatmentNotes } = req.body;

      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      if (session.status === 'offboarded') {
        return next(new AppError('Patient already offboarded', 400));
      }

      await PatientSessionModel.offboard(sessionId, req.user.id, treatmentNotes);

      // Update ambulance status back to active
      await AmbulanceModel.update(session.ambulance_id, {
        status: 'active',
        current_hospital_id: null
      });

      // Emit socket event
      const io = req.app.get('io');
      io.to(`ambulance_${session.ambulance_id}`).emit('patient_offboarded', { sessionId });

      res.json({
        success: true,
        message: 'Patient offboarded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSession(req, res, next) {
    try {
      const { sessionId } = req.params;

      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Get vital signs
      const vitals = await VitalSignModel.findBySession(sessionId, 20);

      // Get communications
      const communications = await CommunicationModel.findBySession(sessionId);

      res.json({
        success: true,
        data: {
          session,
          vitals,
          communications
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSessions(req, res, next) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const filters = {
        status,
        limit,
        offset
      };

      // Superadmin sees all sessions, others see only their organization's sessions
      if (req.user.role !== 'superadmin') {
        filters.organizationId = req.user.organizationId;
      }

      const sessions = await PatientSessionModel.findAll(filters);
      const countFilters = { status };
      if (req.user.role !== 'superadmin') {
        countFilters.organizationId = req.user.organizationId;
      }
      const total = await PatientSessionModel.count(countFilters);

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + sessions.length) < total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async addVitalSigns(req, res, next) {
    try {
      const { patientId } = req.params;
      const vitalData = req.body;

      // Find active session for patient
      const session = await PatientSessionModel.findActiveByPatient(patientId);
      if (!session) {
        return next(new AppError('No active session found for this patient', 404));
      }

      const vitalId = await VitalSignModel.create({
        sessionId: session.id,
        ...vitalData
      });

      // Emit socket event for real-time dashboard update
      const io = req.app.get('io');
      io.to(`session_${session.id}`).emit('vital_update', { vitalId, ...vitalData });

      res.status(201).json({
        success: true,
        message: 'Vital signs added successfully',
        data: { vitalId }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getVitalSigns(req, res, next) {
    try {
      const { patientId } = req.params;
      const { limit = 20 } = req.query;

      // Find active session for patient
      const session = await PatientSessionModel.findActiveByPatient(patientId);
      if (!session) {
        return next(new AppError('No active session found for this patient', 404));
      }

      const vitalSigns = await VitalSignModel.findBySession(session.id, parseInt(limit));

      res.json({
        success: true,
        data: { vitalSigns, sessionId: session.id }
      });
    } catch (error) {
      next(error);
    }
  }

  static async addCommunication(req, res, next) {
    try {
      const { patientId } = req.params;
      const { messageType, message, metadata } = req.body;

      // Find active session for patient
      const session = await PatientSessionModel.findActiveByPatient(patientId);
      if (!session) {
        return next(new AppError('No active session found for this patient', 404));
      }

      const communicationId = await CommunicationModel.create({
        sessionId: session.id,
        senderId: req.user.id,
        messageType: messageType || 'text',
        message,
        metadata
      });

      // Emit socket event for real-time group chat
      const io = req.app.get('io');
      io.to(`session_${session.id}`).emit('new_message', {
        id: communicationId,
        senderId: req.user.id,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        senderRole: req.user.role,
        message,
        messageType: messageType || 'text',
        metadata,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { communicationId }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPatientSessions(req, res, next) {
    try {
      const { patientId } = req.params;
      
      const patient = await PatientModel.findById(patientId);
      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }

      const sessions = await PatientSessionModel.findByPatient(patientId);

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }

  // Chat/Communication methods for trip-based group chat
  static async getSessionMessages(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { limit = 100 } = req.query;

      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Check if user has access to this session
      if (req.user.role !== 'superadmin' && req.user.organizationId !== session.organization_id) {
        return next(new AppError('Access denied to this session', 403));
      }

      const messages = await CommunicationModel.findBySession(sessionId, parseInt(limit));

      res.json({
        success: true,
        data: { messages }
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendSessionMessage(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { messageType, message, metadata } = req.body;

      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Check if user has access to this session
      if (req.user.role !== 'superadmin' && req.user.organizationId !== session.organization_id) {
        return next(new AppError('Access denied to this session', 403));
      }

      const communicationId = await CommunicationModel.create({
        sessionId,
        senderId: req.user.id,
        messageType: messageType || 'text',
        message,
        metadata
      });

      // Emit socket event for real-time group chat
      const io = req.app.get('io');
      io.to(`session_${sessionId}`).emit('new_message', {
        id: communicationId,
        sessionId,
        senderId: req.user.id,
        senderFirstName: req.user.firstName,
        senderLastName: req.user.lastName,
        senderRole: req.user.role,
        senderEmail: req.user.email,
        message,
        messageType: messageType || 'text',
        metadata,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { 
          id: communicationId,
          sessionId,
          message,
          messageType: messageType || 'text'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async markMessageAsRead(req, res, next) {
    try {
      const { messageId } = req.params;
      
      const success = await CommunicationModel.markAsRead(messageId, req.user.id);
      
      if (!success) {
        return next(new AppError('Message not found', 404));
      }

      res.json({
        success: true,
        message: 'Message marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      const count = await CommunicationModel.getUnreadCount(sessionId, req.user.id);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;

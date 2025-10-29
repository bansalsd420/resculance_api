const PatientModel = require('../models/Patient');
const PatientSessionModel = require('../models/PatientSession');
const AmbulanceModel = require('../models/Ambulance');
const VitalSignModel = require('../models/VitalSign');
const CommunicationModel = require('../models/Communication');
const { AppError } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

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

      res.json({
        success: true,
        data: {
          patients,
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
        data: { patient }
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
        ambulanceId, assignedDoctorId, assignedParamedicId,
        pickupLocation, pickupLat, pickupLng, destinationLocation,
        destinationLat, destinationLng, destinationHospitalId, chiefComplaint, initialAssessment
      } = req.body;

      // Check if ambulance is available
      const ambulance = await AmbulanceModel.findById(ambulanceId);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      if (ambulance.status !== 'active') {
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
        hospitalId: destinationHospitalId || req.user.organizationId,
        fleetOwnerId: ambulance.organization_type === 'fleet_owner' ? ambulance.organization_id : null,
        assignedDoctorId,
        assignedParamedicId,
        pickupLocation,
        pickupLat,
        pickupLng,
        destinationLocation,
        destinationLat,
        destinationLng,
        chiefComplaint,
        initialAssessment,
        onboardedBy: req.user.id,
        status: 'onboarded'
      });

      // Update ambulance status
      await AmbulanceModel.update(ambulanceId, {
        status: 'en_route',
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
        hospitalId: req.user.organizationId,
        status,
        limit,
        offset
      };

      const sessions = await PatientSessionModel.findAll(filters);
      const total = await PatientSessionModel.count({ hospitalId: req.user.organizationId, status });

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
      const { receiverId, communicationType, message, duration } = req.body;

      // Find active session for patient
      const session = await PatientSessionModel.findActiveByPatient(patientId);
      if (!session) {
        return next(new AppError('No active session found for this patient', 404));
      }

      const communicationId = await CommunicationModel.create({
        sessionId: session.id,
        senderId: req.user.id,
        receiverId,
        communicationType,
        message,
        duration
      });

      // Emit socket event
      const io = req.app.get('io');
      io.to(`session_${session.id}`).emit('new_message', {
        communicationId,
        senderId: req.user.id,
        message,
        communicationType
      });

      res.status(201).json({
        success: true,
        message: 'Communication logged successfully',
        data: { communicationId }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;

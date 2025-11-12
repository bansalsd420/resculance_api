const PatientModel = require('../models/Patient');
const PatientSessionModel = require('../models/PatientSession');
const AmbulanceModel = require('../models/Ambulance');
const VitalSignModel = require('../models/VitalSign');
const CommunicationModel = require('../models/Communication');
const { AppError } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const NotificationService = require('../services/notificationService');
const db = require('../config/database');

// Helper: determine whether the current user has access to a given session
const userCanAccessSession = async (req, session) => {
  if (!req || !req.user) return false;
  if (req.user.role === 'superadmin') return true;

  const userOrgId = req.user.organizationId;
  const userOrgType = req.user.organizationType;

  const sessionOwnerOrg = session.organization_id || session.organizationId;
  const sessionDestination = session.destination_hospital_id || session.destinationHospitalId;

  // Session owner org may always access
  if (sessionOwnerOrg && parseInt(sessionOwnerOrg) === parseInt(userOrgId)) return true;

  // Hospital can access if they are the destination hospital
  if (userOrgType === 'hospital' && sessionDestination && parseInt(sessionDestination) === parseInt(userOrgId)) return true;

  // Assigned ambulance crew can access
  try {
    const [assignments] = await db.query(
      `SELECT id FROM ambulance_assignments WHERE ambulance_id = ? AND user_id = ? AND is_active = TRUE`,
      [session.ambulance_id || session.ambulanceId, req.user.id]
    );
    if (assignments && assignments.length > 0) return true;
  } catch (e) {
    // ignore errors here
  }

  // Fleet owners who own the ambulance may access
  if (userOrgType === 'fleet_owner') {
    try {
      const [ambRows] = await db.query('SELECT organization_id FROM ambulances WHERE id = ? LIMIT 1', [session.ambulance_id || session.ambulanceId]);
      if (ambRows && ambRows[0] && parseInt(ambRows[0].organization_id) === parseInt(userOrgId)) return true;
    } catch (e) {
      // ignore
    }
  }

  return false;
};

// Helper function to map snake_case to camelCase
const mapPatientFields = (patient) => {
  if (!patient) return null;
  return {
    ...patient,
    firstName: patient.first_name,
    lastName: patient.last_name,
  age: patient.age,
    bloodGroup: patient.blood_group,
    phone: patient.phone || patient.contact_phone,
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
        firstName, lastName, age, gender, bloodGroup, phone, email,
          emergencyContactName, emergencyContactPhone, address,
        medicalHistory, allergies, currentMedications
      } = req.body;

      // Only firstName is required
      if (!firstName || !firstName.trim()) {
        return next(new AppError('First name is required', 400));
      }

      const patientCode = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Associate patient with the caller's organization by default.
      // If the caller is a superadmin they may provide an explicit organizationId in the body.
      let organizationId = null;
      if (req.user.role === 'superadmin') {
        organizationId = req.body.organizationId || null;
      } else {
        organizationId = req.user.organizationId;
      }

      if (!req.user || !req.user.id) {
        return next(new AppError('Authentication required to create patient', 401));
      }

      const patientId = await PatientModel.create({
        organizationId,
        patientCode,
        firstName,
        lastName: lastName || null,
        age: age || null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        phone: phone || null,
        email: email || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRelation: req.body.emergencyContactRelation || null,
        address: address || null,
        medicalHistory: medicalHistory || null,
        allergies: allergies || null,
        currentMedications: currentMedications || null,
        createdBy: req.user.id
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
      const { search, limit = 50, offset = 0, includeInactive } = req.query;

      // Scope patient listing by organization for non-superadmins. Superadmin may pass organizationId to scope.
      const filters = { search, limit, offset };
      // includeInactive may come as 'true'|'1'|1|true
      if (includeInactive === 'true' || includeInactive === '1' || includeInactive === 1 || includeInactive === true) {
        filters.includeInactive = true;
      }
      if (req.user.role === 'superadmin') {
        if (req.query.organizationId) filters.organizationId = req.query.organizationId;
        // if superadmin does not pass organizationId, we allow listing across all orgs
      } else {
        filters.organizationId = req.user.organizationId;
      }
  const patients = await PatientModel.findAll(filters);
  const total = await PatientModel.count({ search, organizationId: filters.organizationId, includeInactive: filters.includeInactive });

      // Map snake_case to camelCase for frontend and include latest session status
      const mappedPatients = patients.map(p => {
        const mp = mapPatientFields(p);
        mp.latestSessionStatus = p.latest_session_status || null;
        return mp;
      });

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

  // **NEW DENORMALIZED ENDPOINT** - Blazing fast query for available patients
  static async getAvailablePatients(req, res, next) {
    try {
      const { search, limit = 100, offset = 0 } = req.query;

      const filters = { search, limit, offset };
      
      // Scope by organization for non-superadmins
      if (req.user.role !== 'superadmin') {
        filters.organizationId = req.user.organizationId;
      } else if (req.query.organizationId) {
        filters.organizationId = req.query.organizationId;
      }

      // Use denormalized query - no joins, instant results
      const patients = await PatientModel.findAvailablePatients(filters);

      res.json({
        success: true,
        data: {
          patients: patients.map(mapPatientFields),
          count: patients.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        firstName, lastName, age, gender, bloodGroup, phone, email,
        emergencyContactName, emergencyContactPhone, emergencyContactRelation,
        address, medicalHistory, allergies, currentMedications
      } = req.body;

      const patient = await PatientModel.findById(id);
      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }

      // Authorization: allow superadmin or org-scoped staff (doctors, paramedics, admins)
      if (req.user.role !== 'superadmin') {
        // ensure same organization
        if (patient.organization_id !== req.user.organizationId) {
          return next(new AppError('Forbidden: cannot edit patient from another organization', 403));
        }
        // allow roles containing doctor, paramedic or admin
        const roleLower = (req.user.role || '').toString().toLowerCase();
        if (!/(doctor|paramedic|admin)/.test(roleLower)) {
          return next(new AppError('Forbidden: insufficient permissions to edit patient', 403));
        }
      }

      // Prepare update data - allow null values for most fields
      const updateData = {
        firstName: firstName || patient.first_name,
        lastName: lastName || null,
        age: age || null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        phone: phone || null,
        email: email || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRelation: emergencyContactRelation || null,
        address: address || null,
        medicalHistory: medicalHistory || null,
        allergies: allergies || null,
        currentMedications: currentMedications || null
      };

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

      // **SECURITY CHECK**: Authorization - verify user has access to this operation
      if (!req.user || !req.user.organizationId) {
        return next(new AppError('Unauthorized: User organization not found', 403));
      }

      // Normalize user's organization type for later checks and cross-org sync
      const userOrgType = req.user.organizationType || 'hospital';

      // **SECURITY CHECK**: Validate required fields
      if (!ambulanceId) {
        return next(new AppError('Ambulance ID is required', 400));
      }
      
      // Set default pickup location if not provided
      const finalPickupLocation = pickupLocation || 'Current Location';
      const finalPickupLat = pickupLatitude !== undefined ? pickupLatitude : 0;
      const finalPickupLng = pickupLongitude !== undefined ? pickupLongitude : 0;
      
      // Set default destination if not provided (will be determined by hospital)
      const finalDestLocation = destinationLocation || 'Hospital';
      const finalDestLat = destinationLatitude !== undefined ? destinationLatitude : 0;
      const finalDestLng = destinationLongitude !== undefined ? destinationLongitude : 0;

      // **SECURITY CHECK**: Validate ambulance exists and is operational
      const ambulance = await AmbulanceModel.findById(ambulanceId);
      if (!ambulance) {
        return next(new AppError('Ambulance not found', 404));
      }

      // **SECURITY CHECK**: Strict status validation - only allow 'available' ambulances for new onboarding
      const allowedStatuses = ['available'];
      if (!allowedStatuses.includes(ambulance.status)) {
        return next(new AppError(
          `Cannot onboard patient: Ambulance status is '${ambulance.status}'. Only ambulances with 'available' status can accept new patients.`,
          400
        ));
      }

      // **SECURITY CHECK**: Verify ambulance is not already assigned
      const activeSession = await PatientSessionModel.findActiveByAmbulance(ambulanceId);
      if (activeSession) {
        return next(new AppError('Ambulance already has an active patient session', 400));
      }

      // **SECURITY CHECK**: Ensure patient exists and is active
      const patient = await PatientModel.findById(patientId);
      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }
      
      console.log('🔐 Patient ownership check:', {
        patientId,
        patientOrgId: patient.organizationId,
        userOrgId: req.user.organizationId,
        userRole: req.user.role,
        userOrgType: req.user.organizationType,
        match: patient.organizationId === req.user.organizationId
      });
      
      // **SECURITY CHECK**: Verify patient belongs to accessible organization
      // For fleet owners: patient must belong to their organization
      // For hospitals: patient must belong to their organization (they onboard their own patients onto any ambulance)
      if (req.user.role !== 'superadmin') {
        if (patient.organizationId !== req.user.organizationId) {
          console.error('❌ Patient organization mismatch!', {
            patientOrgId: patient.organizationId,
            userOrgId: req.user.organizationId
          });
          return next(new AppError('Unauthorized: You can only onboard patients from your organization', 403));
        }
      }
      
      if (patient.status !== 'active') {
        return next(new AppError(`Cannot onboard patient: Patient status is '${patient.status}'. Only active patients can be onboarded.`, 400));
      }

      // **SECURITY CHECK**: Prevent onboarding if patient already has an active session
      const patientActiveSession = await PatientSessionModel.findActiveByPatient(patientId);
      if (patientActiveSession) {
        return next(new AppError('Patient already has an active session. Please offboard the patient from the current session first.', 400));
      }

      // **SECURITY CHECK**: Verify ambulance belongs to accessible organization
      // For fleet owners, the ambulance must be theirs
      // For hospitals, the ambulance can be from a partnered fleet
      if (req.user.role !== 'superadmin') {
        
        if (userOrgType === 'fleet_owner') {
          // Fleet owners can only use their own ambulances
          if (ambulance.organizationId !== req.user.organizationId) {
            console.error('❌ Ambulance ownership check failed for fleet_owner', {
              ambulanceId: ambulance.id,
              ambulance_org_id: ambulance.organization_id,
              ambulance_orgId: ambulance.organizationId,
              userOrgId: req.user.organizationId
            });
            return next(new AppError('Unauthorized: You can only use ambulances from your fleet', 403));
          }
        } else if (userOrgType === 'hospital') {
          // Hospitals can use ambulances from partnered fleets
          // This is validated by checking if there's an active collaboration
          const CollaborationModel = require('../models/CollaborationRequest');
          const partnership = await CollaborationModel.findActivePartnership(
            req.user.organizationId,
            ambulance.organizationId
          );
          
          if (!partnership && ambulance.organizationId !== req.user.organizationId) {
            console.error('❌ Partnership check failed for hospital user', {
              ambulanceId: ambulance.id,
              ambulance_org_id: ambulance.organization_id,
              ambulance_orgId: ambulance.organizationId,
              userOrgId: req.user.organizationId,
              partnership
            });
            return next(new AppError('Unauthorized: No active partnership with this ambulance\'s fleet', 403));
          }
        }
      }

      const sessionCode = `SES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const sessionId = await PatientSessionModel.create({
        sessionCode,
        patientId,
        ambulanceId,
        organizationId: req.user.organizationId, // The hospital initiating the trip
        destinationHospitalId: destinationHospitalId || req.user.organizationId,
        pickupLocation: finalPickupLocation,
        pickupLatitude: finalPickupLat,
        pickupLongitude: finalPickupLng,
        destinationLocation: finalDestLocation,
        destinationLatitude: finalDestLat,
        destinationLongitude: finalDestLng,
        chiefComplaint: chiefComplaint || null,
        initialAssessment: initialAssessment || null,
        onboardedBy: req.user.id,
        status: 'onboarded'
      });

      // Update ambulance status
      await AmbulanceModel.update(ambulanceId, {
        status: 'active',
        current_hospital_id: req.user.organizationId
      });

      // **DENORMALIZATION UPDATE**: Mark patient as onboarded
      await PatientModel.markAsOnboarded(patientId, sessionId);

      // **CROSS-ORG SYNC**: Create patient copy for partner organization
      try {
        // If hospital onboards on fleet ambulance, create patient for fleet
        if (userOrgType === 'hospital' && ambulance.organizationId !== req.user.organizationId) {
          console.log(`📋 Cross-org sync: Hospital ${req.user.organizationId} onboarding on fleet ${ambulance.organizationId} ambulance`);
          
          // Check if patient already exists for fleet
          const existingFleetPatient = await db.query(
            'SELECT id FROM patients WHERE first_name = ? AND last_name = ? AND organization_id = ?',
            [patient.first_name, patient.last_name, ambulance.organizationId]
          );
          
          if (existingFleetPatient[0].length === 0) {
            console.log(`📋 Creating patient copy for fleet ${ambulance.organizationId}`);
            await PatientModel.create({
              organizationId: ambulance.organizationId,
              patientCode: `${patient.patient_code}-FLEET`,
              firstName: patient.first_name,
              lastName: patient.last_name,
              age: patient.age,
              gender: patient.gender,
              bloodGroup: patient.blood_group,
              phone: patient.phone,
              emergencyContactName: patient.emergency_contact_name,
              emergencyContactPhone: patient.emergency_contact_phone,
              emergencyContactRelation: patient.emergency_contact_relation,
              address: patient.address,
              medicalHistory: patient.medical_history,
              allergies: patient.allergies,
              currentMedications: patient.current_medications,
              createdBy: req.user.id
            });
            console.log(`✅ Patient copy created for fleet`);
          }
        }
        
        // If fleet delivers to hospital, create patient for hospital
        if (userOrgType === 'fleet_owner' && destinationHospitalId && destinationHospitalId !== req.user.organizationId) {
          console.log(`📋 Cross-org sync: Fleet ${req.user.organizationId} delivering to hospital ${destinationHospitalId}`);
          
          // Check if patient already exists for hospital
          const existingHospitalPatient = await db.query(
            'SELECT id FROM patients WHERE first_name = ? AND last_name = ? AND organization_id = ?',
            [patient.first_name, patient.last_name, destinationHospitalId]
          );
          
          if (existingHospitalPatient[0].length === 0) {
            console.log(`📋 Creating patient copy for hospital ${destinationHospitalId}`);
            await PatientModel.create({
              organizationId: destinationHospitalId,
              patientCode: `${patient.patient_code}-HOSP`,
              firstName: patient.first_name,
              lastName: patient.last_name,
              age: patient.age,
              gender: patient.gender,
              bloodGroup: patient.blood_group,
              phone: patient.phone,
              emergencyContactName: patient.emergency_contact_name,
              emergencyContactPhone: patient.emergency_contact_phone,
              emergencyContactRelation: patient.emergency_contact_relation,
              address: patient.address,
              medicalHistory: patient.medical_history,
              allergies: patient.allergies,
              currentMedications: patient.current_medications,
              createdBy: req.user.id
            });
            console.log(`✅ Patient copy created for hospital`);
          }
        }
      } catch (syncError) {
        console.error('❌ Cross-org patient sync failed:', syncError);
        // Don't fail the onboarding if sync fails
      }

      // Emit socket event
      const io = req.app.get('io');
      io.to(`ambulance_${ambulanceId}`).emit('patient_onboarded', { sessionId, sessionCode });

      // Notify ambulance crew about patient onboarding
      if (patient) {
        await NotificationService.notifyAmbulanceCrewPatientOnboarded(
          ambulanceId,
          {
            sessionId,
            sessionCode,
            patientId,
            firstName: patient.first_name,
            lastName: patient.last_name
          }
        );
      }

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

      // Authorization: ensure caller has permission to offboard this session
      if (req.user.role !== 'superadmin') {
        let allowed = false;

        // 1. Organization that owns the session may offboard
        if (session.organization_id === req.user.organizationId || session.organizationId === req.user.organizationId) {
          allowed = true;
        }

        // 2. Hospital users may offboard when the destination hospital is their org
        if (!allowed && req.user.organizationType === 'hospital') {
          if (session.destination_hospital_id === req.user.organizationId || session.destinationHospitalId === req.user.organizationId) {
            allowed = true;
          }
        }

        // 3. Assigned ambulance crew may offboard
        if (!allowed) {
          const [assignments] = await db.query(
            `SELECT id FROM ambulance_assignments WHERE ambulance_id = ? AND user_id = ? AND is_active = TRUE`,
            [session.ambulance_id, req.user.id]
          );
          if (assignments.length > 0) allowed = true;
        }

        // 4. Fleet owners may offboard if they own the ambulance
        if (!allowed && req.user.organizationType === 'fleet_owner') {
          const [ambRows] = await db.query('SELECT organization_id FROM ambulances WHERE id = ? LIMIT 1', [session.ambulance_id]);
          if (ambRows && ambRows[0] && parseInt(ambRows[0].organization_id) === parseInt(req.user.organizationId)) {
            allowed = true;
          }
        }

        if (!allowed) {
          return next(new AppError('You do not have permission to offboard this session', 403));
        }
      }

      await PatientSessionModel.offboard(sessionId, req.user.id, treatmentNotes);

      // Update ambulance status back to available (so it can be used again)
      await AmbulanceModel.update(session.ambulance_id, {
        status: 'available',
        current_hospital_id: null
      });

      // **DENORMALIZATION UPDATE**: Mark patient as offboarded
      await PatientModel.markAsOffboarded(session.patient_id);

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`ambulance_${session.ambulance_id}`).emit('patient_offboarded', { sessionId });
        io.to(`session_${sessionId}`).emit('session_offboarded', { sessionId });
      }

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

      // Authorization: Check if user has access to this session
      // Superadmin can access all sessions
      if (req.user.role !== 'superadmin') {
        let hasAccess = false;

        // 1. Check if user's organization owns the session
        if (session.organization_id === req.user.organizationId) {
          hasAccess = true;
        }

        // 2. Hospital users can access sessions where their hospital is the destination
        if (!hasAccess && req.user.organizationType === 'hospital') {
          if (session.destination_hospital_id === req.user.organizationId || 
              session.hospital_id === req.user.organizationId) {
            hasAccess = true;
          }
        }

        // 3. Check if user is assigned to the ambulance in this session
        if (!hasAccess) {
          const [assignments] = await db.query(
            `SELECT id FROM ambulance_assignments 
             WHERE ambulance_id = ? AND user_id = ? AND is_active = TRUE`,
            [session.ambulance_id, req.user.id]
          );
          if (assignments.length > 0) {
            hasAccess = true;
          }
        }

        // 4. Check partnership between fleet and hospital
        if (!hasAccess) {
          try {
            // Get the ambulance's fleet organization
            const [ambRows] = await db.query(
              'SELECT organization_id FROM ambulances WHERE id = ? LIMIT 1',
              [session.ambulance_id]
            );
            
            if (ambRows && ambRows[0]) {
              const ambulanceFleetId = ambRows[0].organization_id;
              
              // Check if there's an active partnership
              const Partnership = require('../models/Partnership');
              
              // Fleet user checking partnership with destination hospital (fleet may view sessions
              // where they deliver to a partnered hospital). We do NOT grant hospital users
              // access to arbitrary partnered fleet sessions unless the hospital is the destination.
              if (req.user.organizationType === 'fleet_owner' && session.destination_hospital_id) {
                const partnership = await Partnership.findByFleetAndHospital(
                  req.user.organizationId,
                  session.destination_hospital_id
                );
                if (partnership && partnership.status === 'active') {
                  hasAccess = true;
                }
              }
            }
          } catch (partnershipError) {
            console.warn('Error checking partnership:', partnershipError);
          }
        }

        if (!hasAccess) {
          return next(new AppError('You do not have access to this session', 403));
        }
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
      const { status, limit = 50, offset = 0, ambulanceId } = req.query;

      const filters = {
        status,
        limit,
        offset
      };

      // If ambulanceId is provided and caller only requested a single latest session (limit=1),
      // fetch the true latest session for that ambulance (no org scoping) and then authorize it.
      if (ambulanceId && parseInt(limit) === 1) {
        const latest = await PatientSessionModel.findLatestByAmbulance(ambulanceId);
        if (!latest) {
          return res.json({ success: true, data: { sessions: [], pagination: { total: 0, limit: 1, offset: 0, hasMore: false }, hasSession: false } });
        }

        // If user can access, return the session; otherwise return an empty array but indicate a session exists
        const allowed = await userCanAccessSession(req, latest);
        if (allowed) {
          return res.json({ success: true, data: { sessions: [latest], pagination: { total: 1, limit: 1, offset: 0, hasMore: false }, hasSession: true } });
        }

        return res.json({ success: true, data: { sessions: [], pagination: { total: 0, limit: 1, offset: 0, hasMore: false }, hasSession: true } });
      }

      // If ambulanceId is provided in query, include it in filters
      if (ambulanceId) {
        filters.ambulanceId = ambulanceId;
      }

      // Superadmin sees all sessions. For non-superadmins, normally scope by organizationId.
      // However, when ambulanceId is provided, allow users who are actively assigned to that ambulance
      // (e.g., paramedics/doctors assigned to the ambulance) to view its sessions even if their
      // organizationId differs. This enables onboarded crew to see sessions for their ambulance.
      if (req.user.role !== 'superadmin') {
        // By default we scope to the user's organization. However when ambulanceId is provided
        // allow additional visibility in these cases:
        // - user is assigned to the ambulance
        // - user is a hospital staff/admin and the hospital has an active partnership with the ambulance's fleet
        // - user is a fleet_owner and owns the ambulance
        let allow = false;
        if (ambulanceId) {
          try {
            const AmbulanceModel = require('../models/Ambulance');
            const assigned = await AmbulanceModel.getAssignedUsers(ambulanceId);
            if (Array.isArray(assigned) && assigned.some(u => parseInt(u.id) === parseInt(req.user.id))) {
              allow = true;
            } else {
              // Not assigned; check ambulance owner and partnership
              const db = require('../config/database');
              const [ambRows] = await db.query('SELECT organization_id FROM ambulances WHERE id = ? LIMIT 1', [ambulanceId]);
              if (ambRows && ambRows[0]) {
                const ambulanceOwnerOrg = ambRows[0].organization_id;
                // Fleet owner who owns the ambulance
                if (req.user.organizationType === 'fleet_owner' && parseInt(req.user.organizationId) === parseInt(ambulanceOwnerOrg)) {
                  allow = true;
                }
                // Note: Hospitals are NOT granted visibility here via partnership alone.
                // They will only be granted visibility if they are the session destination (handled below).
              }
            }
          } catch (e) {
            console.warn('Failed to check ambulance assignments/partnership for session visibility:', e.message || e);
          }
        }

        if (!allow) {
          // For hospital users, allow visibility if the session's destination hospital is their organization
          // by instructing the model to include destination_hospital_id in the filter logic.
          if (req.user.organizationType === 'hospital') {
            filters.organizationId = req.user.organizationId;
            filters.allowDestination = true; // custom flag handled in model
          } else {
            filters.organizationId = req.user.organizationId;
          }
        }
      }

      let sessions = await PatientSessionModel.findAll(filters);

      // Post-filter sessions to ensure hospital users don't see sessions where they're not allowed.
      if (req.user.role !== 'superadmin') {
        const filtered = [];
        for (const s of sessions) {
          const allowed = await userCanAccessSession(req, s);
          if (allowed) filtered.push(s);
        }
        sessions = filtered;
      }

      const countFilters = { status };
      if (ambulanceId) countFilters.ambulanceId = ambulanceId;
      if (req.user.role !== 'superadmin') {
        countFilters.organizationId = req.user.organizationId;
        if (filters && filters.allowDestination) countFilters.allowDestination = true;
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

      // Authorization: ensure user may add communication to this session
      const allowedComm = await userCanAccessSession(req, session);
      if (!allowedComm) return next(new AppError('Access denied to this session', 403));

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

      // Restrict access: non-superadmins can only fetch sessions for patients in their org
      if (req.user.role !== 'superadmin' && patient.organization_id !== req.user.organizationId && patient.organizationId !== req.user.organizationId) {
        return next(new AppError('Access denied to patient sessions', 403));
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

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const patient = await PatientModel.findById(id);
      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }

      // Check for active sessions and offboard if exists
      const activeSession = await PatientSessionModel.findActiveByPatient(id);
      if (activeSession) {
        // Offboard the patient first
        await PatientSessionModel.offboard(activeSession.id, req.user.id);
        // Ensure ambulance status is updated back to available when patient is offboarded via this flow
        try {
          await AmbulanceModel.update(activeSession.ambulance_id, {
            status: 'available',
            current_hospital_id: null
          });
        } catch (err) {
          // log and continue - don't block patient deactivation on ambulance status update failures
          console.warn('Failed to update ambulance status after patient deactivation/offboard:', err);
        }
      }

      // Soft delete - deactivate the patient
      await PatientModel.deactivate(id);

      res.json({
        success: true,
        message: 'Patient deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async activate(req, res, next) {
    try {
      const { id } = req.params;

      // Allow activation of patients that are currently inactive, so fetch without active filter
      const patient = await PatientModel.findByIdIncludeInactive(id);
      if (!patient) {
        return next(new AppError('Patient not found', 404));
      }

      await PatientModel.activate(id);

      res.json({
        success: true,
        message: 'Patient activated successfully'
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
      if (!session) return next(new AppError('Session not found', 404));

      const allowed = await userCanAccessSession(req, session);
      if (!allowed) return next(new AppError('Access denied to this session', 403));

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

      console.log(`[sendSessionMessage] User ${req.user?.id} attempting to send message to session ${sessionId}`);

      const session = await PatientSessionModel.findById(sessionId);
      if (!session) {
        console.warn(`[sendSessionMessage] Session ${sessionId} not found (requested by ${req.user?.id})`);
        return next(new AppError('Session not found', 404));
      }

      const allowedSend = await userCanAccessSession(req, session);
      if (!allowedSend) {
        console.warn(`[sendSessionMessage] Access denied for user ${req.user?.id} to session ${sessionId}`);
        return next(new AppError('Access denied to this session', 403));
      }
      
      console.log(`[sendSessionMessage] Permission granted for user ${req.user?.id} to send to session ${sessionId}`);
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

      console.log(`[sendSessionMessage] Message ${communicationId} emitted to session ${sessionId} by user ${req.user?.id}`);

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
      if (!session) return next(new AppError('Session not found', 404));

      const allowedUnread = await userCanAccessSession(req, session);
      if (!allowedUnread) return next(new AppError('Access denied to this session', 403));

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

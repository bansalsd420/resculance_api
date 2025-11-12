const db = require('../config/database');

class PatientSessionModel {
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO patient_sessions (session_code, patient_id, ambulance_id, organization_id,
                                      pickup_location, pickup_latitude, pickup_longitude,
                                      destination_hospital_id, destination_location, destination_latitude, destination_longitude,
                                      chief_complaint, initial_assessment, onboarded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sessionCode,
        data.patientId,
        data.ambulanceId,
        data.organizationId || data.hospitalId, // Support both field names for compatibility
        data.pickupLocation,
        data.pickupLat || data.pickupLatitude,
        data.pickupLng || data.pickupLongitude,
        data.destinationHospitalId,
        data.destinationLocation,
        data.destinationLat || data.destinationLatitude,
        data.destinationLng || data.destinationLongitude,
        data.chiefComplaint,
        data.initialAssessment,
        data.onboardedBy,
        data.status || 'onboarded'
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT ps.*, 
              p.first_name as patient_first_name, p.last_name as patient_last_name,
              p.age, p.gender, p.blood_group, p.medical_history, p.allergies, p.current_medications,
              a.ambulance_code, a.registration_number, a.vehicle_model, a.vehicle_type,
              org.name as organization_name, org.type as organization_type,
              dest_org.name as destination_hospital_name
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations org ON ps.organization_id = org.id
       LEFT JOIN organizations dest_org ON ps.destination_hospital_id = dest_org.id
       WHERE ps.id = ?`,
      [id]
    );
    
    const session = rows[0];
    if (session) {
      // Fetch the assigned crew members for this ambulance
      const [crew] = await db.query(
        `SELECT u.id, u.first_name, u.last_name, u.role, u.email, u.phone,
                aa.role as assignment_role, aa.assigned_at
         FROM ambulance_assignments aa
         JOIN users u ON aa.user_id = u.id
         WHERE aa.ambulance_id = ? AND aa.is_active = TRUE`,
        [session.ambulance_id]
      );
      session.crew = crew || [];
      
      // Separate crew by role for easier frontend access
      session.doctors = crew.filter(c => c.role && c.role.toLowerCase().includes('doctor'));
      session.paramedics = crew.filter(c => c.role && c.role.toLowerCase().includes('paramedic'));
      session.drivers = crew.filter(c => c.role && c.role.toLowerCase().includes('driver'));
    }
    
    return session;
  }

  static async findByCode(code) {
    const [rows] = await db.query(
      `SELECT ps.*, 
              p.first_name as patient_first_name, p.last_name as patient_last_name,
              a.ambulance_code, 
              org.name as organization_name, org.type as organization_type
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations org ON ps.organization_id = org.id
       WHERE ps.session_code = ?`,
      [code]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT ps.*, 
                        p.first_name as patient_first_name, p.last_name as patient_last_name,
                        a.ambulance_code, a.registration_number,
                        org.name as organization_name, org.code as organization_code, org.type as organization_type,
                        dest_org.name as destination_hospital_name
                 FROM patient_sessions ps
                 JOIN patients p ON ps.patient_id = p.id
                 JOIN ambulances a ON ps.ambulance_id = a.id
                 JOIN organizations org ON ps.organization_id = org.id
                 LEFT JOIN organizations dest_org ON ps.destination_hospital_id = dest_org.id
                 WHERE 1=1`;
    const params = [];

    if (filters.hospitalId || filters.organizationId) {
      // If caller requests allowDestination, include sessions where the destination hospital
      // equals the provided organizationId (useful for hospital users who should see inbound trips).
      if (filters.allowDestination) {
        query += ' AND (ps.organization_id = ? OR ps.destination_hospital_id = ?)';
        params.push(filters.hospitalId || filters.organizationId);
        params.push(filters.hospitalId || filters.organizationId);
      } else {
        query += ' AND ps.organization_id = ?';
        params.push(filters.hospitalId || filters.organizationId);
      }
    }

    if (filters.ambulanceId) {
      query += ' AND ps.ambulance_id = ?';
      params.push(filters.ambulanceId);
    }

    if (filters.status) {
      // Backwards-compat: some clients pass status='active' meaning any in-progress status.
      // Map 'active' to the DB statuses we use ('onboarded' and 'in_transit').
      if (filters.status === 'active') {
        query += " AND ps.status IN ('onboarded','in_transit')";
      } else {
        query += ' AND ps.status = ?';
        params.push(filters.status);
      }
    }

    query += ' ORDER BY ps.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const [rows] = await db.query(query, params);
    try {
      if (filters && filters.ambulanceId) {
        console.log('🔎 findAll lookup for ambulance', { ambulanceId: filters.ambulanceId, paramsCount: params.length, returned: Array.isArray(rows) ? rows.length : 0, firstId: rows[0] ? rows[0].id : null });
      }
    } catch (e) {
      // ignore logging failures
    }
    // For each session, fetch the assigned crew members
    for (let i = 0; i < rows.length; i++) {
      const [crew] = await db.query(
        `SELECT u.id, u.first_name, u.last_name, u.role, u.email, u.phone,
                aa.role as assignment_role
         FROM ambulance_assignments aa
         JOIN users u ON aa.user_id = u.id
         WHERE aa.ambulance_id = ? AND aa.is_active = TRUE`,
        [rows[i].ambulance_id]
      );
      rows[i].crew = crew || [];
      
      // Separate crew by role for easier frontend access
      rows[i].doctors = crew.filter(c => c.role && c.role.toLowerCase().includes('doctor'));
      rows[i].paramedics = crew.filter(c => c.role && c.role.toLowerCase().includes('paramedic'));
      rows[i].drivers = crew.filter(c => c.role && c.role.toLowerCase().includes('driver'));
    }
    
    return rows;
  }

  static async findActiveByAmbulance(ambulanceId) {
    const [rows] = await db.query(
      `SELECT ps.* FROM patient_sessions ps
       WHERE ps.ambulance_id = ? AND ps.status IN ('active', 'onboarded', 'in_transit')
       ORDER BY ps.onboarded_at DESC
       LIMIT 1`,
      [ambulanceId]
    );
    // Debug: log when a lookup is performed so we can correlate frontend requests with DB results
    try {
      console.log('🔎 findActiveByAmbulance lookup', { ambulanceId, found: Array.isArray(rows) ? rows.length : 0, row: rows[0] || null });
    } catch (e) {
      // swallow logging errors
    }
    return rows[0];
  }

  static async findLatestByAmbulance(ambulanceId) {
    const [rows] = await db.query(
      `SELECT ps.* FROM patient_sessions ps
       WHERE ps.ambulance_id = ?
       ORDER BY ps.created_at DESC
       LIMIT 1`,
      [ambulanceId]
    );
    try {
      console.log('🔎 findLatestByAmbulance', { ambulanceId, found: Array.isArray(rows) ? rows.length : 0, sessionId: rows[0] ? rows[0].id : null, createdAt: rows[0] ? rows[0].created_at : null });
    } catch (e) {
      // swallow logging errors
    }
    return rows[0] || null;
  }

  static async findActiveByPatient(patientId) {
    const [rows] = await db.query(
      `SELECT ps.* FROM patient_sessions ps
       WHERE ps.patient_id = ? AND ps.status IN ('active', 'onboarded', 'in_transit')
       ORDER BY ps.onboarded_at DESC
       LIMIT 1`,
      [patientId]
    );
    return rows[0];
  }

  static async findByPatient(patientId) {
    const [rows] = await db.query(
      `SELECT ps.*, 
              p.first_name as patient_first_name, p.last_name as patient_last_name,
              a.ambulance_code, a.registration_number, a.vehicle_model, a.vehicle_type,
              org.name as organization_name, org.type as organization_type,
              dest_org.name as destination_hospital_name
       FROM patient_sessions ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN ambulances a ON ps.ambulance_id = a.id
       JOIN organizations org ON ps.organization_id = org.id
       LEFT JOIN organizations dest_org ON ps.destination_hospital_id = dest_org.id
       WHERE ps.patient_id = ?
       ORDER BY ps.created_at DESC`,
      [patientId]
    );
    
    // For each session, fetch the assigned crew members
    for (let i = 0; i < rows.length; i++) {
      const [crew] = await db.query(
        `SELECT u.id, u.first_name, u.last_name, u.role, u.email, u.phone,
                aa.role as assignment_role
         FROM ambulance_assignments aa
         JOIN users u ON aa.user_id = u.id
         WHERE aa.ambulance_id = ? AND aa.is_active = TRUE`,
        [rows[i].ambulance_id]
      );
      rows[i].crew = crew || [];
      
      // Separate crew by role for easier frontend access
      rows[i].doctors = crew.filter(c => c.role && c.role.toLowerCase().includes('doctor'));
      rows[i].paramedics = crew.filter(c => c.role && c.role.toLowerCase().includes('paramedic'));
      rows[i].drivers = crew.filter(c => c.role && c.role.toLowerCase().includes('driver'));
    }
    
    return rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE patient_sessions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async offboard(id, offboardedBy, treatmentNotes) {
    // First, get complete session details with all related data
    const session = await this.findById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get user details who offboarded
    const [offboardedByUser] = await db.query(
      `SELECT id, first_name, last_name, email, role FROM users WHERE id = ?`,
      [offboardedBy]
    );

    // Get user details who onboarded
    const [onboardedByUser] = await db.query(
      `SELECT id, first_name, last_name, email, role FROM users WHERE id = ?`,
      [session.onboarded_by]
    );

    // Get ambulance owner organization details
    const [ambulanceOrg] = await db.query(
      `SELECT o.* FROM organizations o
       JOIN ambulances a ON a.organization_id = o.id
       WHERE a.id = ?`,
      [session.ambulance_id]
    );

    // Get all session data (notes, medications, files) added during session
    const [sessionDataRows] = await db.query(
      `SELECT 
        psd.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
       FROM patient_session_data psd
       LEFT JOIN users u ON psd.added_by = u.id
       WHERE psd.session_id = ?
       ORDER BY psd.added_at ASC`,
      [id]
    );

    // Format session data
    const sessionData = sessionDataRows.map(row => ({
      id: row.id,
      dataType: row.data_type,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      addedBy: {
        id: row.added_by,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role
      },
      addedAt: row.added_at
    }));

    // Group session data by type
    const notes = sessionData.filter(d => d.dataType === 'note');
    const medications = sessionData.filter(d => d.dataType === 'medication');
    const files = sessionData.filter(d => d.dataType === 'file');

    // Calculate session duration
    const onboardedAt = new Date(session.onboarded_at);
    const offboardedAt = new Date();
    const durationMinutes = Math.floor((offboardedAt - onboardedAt) / (1000 * 60));

    // Build comprehensive metadata JSON
    const metadata = {
      // Session Timeline
      timeline: {
        onboarded_at: session.onboarded_at,
        offboarded_at: offboardedAt.toISOString(),
        duration_minutes: durationMinutes,
        estimated_arrival_time: session.estimated_arrival_time,
        actual_arrival_time: session.actual_arrival_time
      },
      
      // Patient Information (snapshot at offboard time)
      patient: {
        id: session.patient_id,
        first_name: session.patient_first_name,
        last_name: session.patient_last_name,
        age: session.age,
        gender: session.gender,
        blood_group: session.blood_group,
        medical_history: session.medical_history,
        allergies: session.allergies,
        current_medications: session.current_medications
      },
      
      // Ambulance Information
      ambulance: {
        id: session.ambulance_id,
        ambulance_code: session.ambulance_code,
        registration_number: session.registration_number,
        vehicle_model: session.vehicle_model,
        vehicle_type: session.vehicle_type,
        owner_organization: ambulanceOrg[0] || null
      },
      
      // Crew Members (snapshot at offboard time)
      crew: {
        all_members: session.crew || [],
        doctors: session.doctors || [],
        paramedics: session.paramedics || [],
        drivers: session.drivers || []
      },
      
      // Organizations Involved
      organizations: {
        session_owner: {
          id: session.organization_id,
          name: session.organization_name,
          type: session.organization_type
        },
        destination_hospital: session.destination_hospital_id ? {
          id: session.destination_hospital_id,
          name: session.destination_hospital_name
        } : null
      },
      
      // Location Data
      locations: {
        pickup: {
          address: session.pickup_location,
          latitude: session.pickup_latitude,
          longitude: session.pickup_longitude
        },
        destination: {
          address: session.destination_location,
          latitude: session.destination_latitude,
          longitude: session.destination_longitude
        },
        distance_km: session.distance_km
      },
      
      // Medical Information
      medical: {
        chief_complaint: session.chief_complaint,
        initial_assessment: session.initial_assessment,
        treatment_notes: treatmentNotes,
        outcome_status: session.outcome_status
      },

      // Session Data (Notes, Medications, Files added during session)
      session_data: {
        notes: notes,
        medications: medications,
        files: files,
        total_entries: sessionData.length,
        counts: {
          notes: notes.length,
          medications: medications.length,
          files: files.length
        }
      },
      
      // User Actions
      users: {
        onboarded_by: {
          id: session.onboarded_by,
          name: onboardedByUser[0] ? `${onboardedByUser[0].first_name} ${onboardedByUser[0].last_name}` : 'Unknown',
          email: onboardedByUser[0]?.email,
          role: onboardedByUser[0]?.role
        },
        offboarded_by: {
          id: offboardedBy,
          name: offboardedByUser[0] ? `${offboardedByUser[0].first_name} ${offboardedByUser[0].last_name}` : 'Unknown',
          email: offboardedByUser[0]?.email,
          role: offboardedByUser[0]?.role
        }
      },
      
      // Session Identifiers
      identifiers: {
        session_id: id,
        session_code: session.session_code,
        status: 'offboarded'
      },
      
      // Audit Trail
      audit: {
        created_at: session.created_at,
        updated_at: session.updated_at,
        offboarded_at: offboardedAt.toISOString(),
        metadata_captured_at: offboardedAt.toISOString()
      }
    };

    // Update session with offboard info and metadata
    const [result] = await db.query(
      `UPDATE patient_sessions 
       SET status = 'offboarded', 
           offboarded_by = ?, 
           offboarded_at = NOW(), 
           treatment_notes = ?,
           session_metadata = ?
       WHERE id = ?`,
      [offboardedBy, treatmentNotes, JSON.stringify(metadata), id]
    );
    
    return result.affectedRows > 0;
  }

  static async cancel(id) {
    const [result] = await db.query(
      `UPDATE patient_sessions SET status = 'cancelled' WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM patient_sessions WHERE 1=1';
    const params = [];

    if (filters.hospitalId || filters.organizationId) {
      query += ' AND organization_id = ?';
      params.push(filters.hospitalId || filters.organizationId);
    }

    if (filters.status) {
      if (filters.status === 'active') {
        query += " AND status IN ('onboarded','in_transit')";
      } else {
        query += ' AND status = ?';
        params.push(filters.status);
      }
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = PatientSessionModel;

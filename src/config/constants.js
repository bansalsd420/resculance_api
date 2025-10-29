module.exports = {
  // User roles
  ROLES: {
    SUPERADMIN: 'superadmin',
    HOSPITAL_ADMIN: 'hospital_admin',
    HOSPITAL_STAFF: 'hospital_staff',
    HOSPITAL_DOCTOR: 'hospital_doctor',
    HOSPITAL_PARAMEDIC: 'hospital_paramedic',
    FLEET_ADMIN: 'fleet_admin',
    FLEET_STAFF: 'fleet_staff',
    FLEET_DOCTOR: 'fleet_doctor',
    FLEET_PARAMEDIC: 'fleet_paramedic'
  },

  // Organization types
  ORG_TYPES: {
    HOSPITAL: 'hospital',
    FLEET_OWNER: 'fleet_owner'
  },

  // Ambulance statuses
  AMBULANCE_STATUS: {
    PENDING_APPROVAL: 'pending_approval',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EN_ROUTE: 'en_route',
    MAINTENANCE: 'maintenance',
    SUSPENDED: 'suspended'
  },

  // Patient session statuses
  PATIENT_STATUS: {
    ONBOARDED: 'onboarded',
    IN_TRANSIT: 'in_transit',
    OFFBOARDED: 'offboarded',
    CANCELLED: 'cancelled'
  },

  // Collaboration request statuses
  COLLABORATION_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },

  // User account statuses
  USER_STATUS: {
    PENDING_APPROVAL: 'pending_approval',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
  },

  // Communication types
  COMMUNICATION_TYPES: {
    TEXT: 'text',
    CALL: 'call',
    VIDEO: 'video'
  },

  // Device types
  DEVICE_TYPES: {
    ECG: 'ecg',
    BP_MONITOR: 'bp_monitor',
    PULSE_OXIMETER: 'pulse_oximeter',
    GLUCOSE_MONITOR: 'glucose_monitor',
    GPS_TRACKER: 'gps_tracker',
    TEMPERATURE: 'temperature',
    VENTILATOR: 'ventilator'
  },

  // Socket events
  SOCKET_EVENTS: {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_AMBULANCE: 'join_ambulance',
    LEAVE_AMBULANCE: 'leave_ambulance',
    VITAL_UPDATE: 'vital_update',
    LOCATION_UPDATE: 'location_update',
    MESSAGE: 'message',
    CALL_REQUEST: 'call_request',
    CALL_ANSWER: 'call_answer',
    CALL_END: 'call_end',
    VIDEO_REQUEST: 'video_request',
    VIDEO_ANSWER: 'video_answer',
    VIDEO_END: 'video_end'
  }
};

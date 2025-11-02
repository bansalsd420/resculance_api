const db = require('../config/database');

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const { role, organizationId } = req.user;

      let stats = {};

      if (role === 'superadmin') {
        // Superadmin sees all stats
        const [[{ totalOrganizations }]] = await db.query(
          'SELECT COUNT(*) as totalOrganizations FROM organizations WHERE status = ?',
          ['active']
        );

        const [[{ totalHospitals }]] = await db.query(
          'SELECT COUNT(*) as totalHospitals FROM organizations WHERE UPPER(type) = ? AND status = ?',
          ['HOSPITAL', 'active']
        );

        const [[{ totalFleets }]] = await db.query(
          'SELECT COUNT(*) as totalFleets FROM organizations WHERE UPPER(type) = ? AND status = ?',
          ['FLEET_OWNER', 'active']
        );

        const [[{ totalUsers }]] = await db.query(
          'SELECT COUNT(*) as totalUsers FROM users WHERE status = ?',
          ['active']
        );

        const [[{ totalAmbulances }]] = await db.query(
          'SELECT COUNT(*) as totalAmbulances FROM ambulances WHERE status IN (?, ?)',
          ['active', 'available']
        );

        const [[{ activeTrips }]] = await db.query(
          'SELECT COUNT(*) as activeTrips FROM patient_sessions WHERE status IN (?, ?)',
          ['onboarded', 'in_transit']
        );

        const [[{ totalPatients }]] = await db.query(
          'SELECT COUNT(*) as totalPatients FROM patients'
        );

        const [[{ totalCollaborations }]] = await db.query(
          'SELECT COUNT(*) as totalCollaborations FROM collaboration_requests WHERE status = ?',
          ['accepted']
        );

        stats = {
          totalOrganizations,
          totalHospitals,
          totalFleets,
          totalUsers,
          totalAmbulances,
          activeTrips,
          totalPatients,
          totalCollaborations,
        };
      } else {
        // Organization-specific stats
        const [[{ totalUsers }]] = await db.query(
          'SELECT COUNT(*) as totalUsers FROM users WHERE organization_id = ? AND status = ?',
          [organizationId, 'active']
        );

        const [[{ totalAmbulances }]] = await db.query(
          'SELECT COUNT(*) as totalAmbulances FROM ambulances WHERE organization_id = ? AND status IN (?, ?)',
          [organizationId, 'active', 'available']
        );

        const [[{ activeTrips }]] = await db.query(
          `SELECT COUNT(*) as activeTrips FROM patient_sessions ps
           JOIN ambulances a ON ps.ambulance_id = a.id
           WHERE a.organization_id = ? AND ps.status IN (?, ?)`,
          [organizationId, 'onboarded', 'in_transit']
        );

        const [[{ totalPatients }]] = await db.query(
          `SELECT COUNT(DISTINCT ps.patient_id) as totalPatients FROM patient_sessions ps
           JOIN ambulances a ON ps.ambulance_id = a.id
           WHERE a.organization_id = ?`,
          [organizationId]
        );

        const [[{ totalCollaborations }]] = await db.query(
          `SELECT COUNT(*) as totalCollaborations FROM collaboration_requests 
           WHERE (hospital_id = ? OR fleet_owner_id = ?) AND status = ?`,
          [organizationId, organizationId, 'accepted']
        );

        stats = {
          totalUsers,
          totalAmbulances,
          activeTrips,
          totalPatients,
          totalCollaborations,
        };
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;

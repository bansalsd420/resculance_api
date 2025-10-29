const CollaborationRequestModel = require('../models/CollaborationRequest');
const OrganizationModel = require('../models/Organization');
const AmbulanceModel = require('../models/Ambulance');
const { AppError } = require('../middleware/auth');

class CollaborationController {
  static async create(req, res, next) {
    try {
      const { fleetOwnerId, ambulanceId, message } = req.body;

      // Find fleet owner by ID
      const fleetOwner = await OrganizationModel.findById(fleetOwnerId);
      if (!fleetOwner || fleetOwner.type !== 'fleet_owner') {
        return next(new AppError('Fleet owner not found', 404));
      }

      // If ambulance ID provided, verify it belongs to the fleet owner
      if (ambulanceId) {
        const ambulance = await AmbulanceModel.findById(ambulanceId);
        if (!ambulance) {
          return next(new AppError('Ambulance not found', 404));
        }

        // Verify ambulance belongs to the fleet owner
        if (ambulance.organization_id !== fleetOwner.id) {
          return next(new AppError('Ambulance does not belong to this fleet owner', 400));
        }

        // Check if ambulance is available (allow active or available statuses)
        if (!['active', 'available'].includes(ambulance.status)) {
          return next(new AppError('Ambulance is not available for collaboration', 400));
        }
      }

      const requestId = await CollaborationRequestModel.create({
        hospitalId: req.user.organizationId,
        fleetOwnerId: fleetOwner.id,
        ambulanceId: ambulanceId || null,
        requestedBy: req.user.id,
        requestMessage: message,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Collaboration request sent successfully',
        data: { requestId }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const filters = { status, limit, offset };

      // Hospital users see requests they created
      if (req.user.organizationType === 'hospital') {
        filters.hospitalId = req.user.organizationId;
      }

      // Fleet owner users see requests sent to them
      if (req.user.organizationType === 'fleet_owner') {
        filters.fleetOwnerId = req.user.organizationId;
      }

      const requests = await CollaborationRequestModel.findAll(filters);
      const total = await CollaborationRequestModel.count(filters);

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + requests.length) < total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      // Check access permissions
      if (req.user.role !== 'superadmin' &&
          request.hospital_id !== req.user.organizationId &&
          request.fleet_owner_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      res.json({
        success: true,
        data: { request }
      });
    } catch (error) {
      next(error);
    }
  }

  static async accept(req, res, next) {
    try {
      const { id } = req.params;
      const { responseMessage } = req.body;

      // Only fleet owner can accept requests
      if (req.user.organizationType !== 'fleet_owner') {
        return next(new AppError('Only fleet owners can accept collaboration requests', 403));
      }

      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      if (request.fleet_owner_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      if (request.status !== 'pending') {
        return next(new AppError('Request has already been processed', 400));
      }

      await CollaborationRequestModel.accept(id, req.user.id, responseMessage);

      // Update ambulance to show it can be used by the requesting hospital
      // This is handled in the ambulance onboarding logic

      res.json({
        success: true,
        message: 'Collaboration request accepted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { responseMessage } = req.body;

      // Only fleet owner can reject requests
      if (req.user.organizationType !== 'fleet_owner') {
        return next(new AppError('Only fleet owners can reject collaboration requests', 403));
      }

      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      if (request.fleet_owner_id !== req.user.organizationId) {
        return next(new AppError('Access denied', 403));
      }

      if (request.status !== 'pending') {
        return next(new AppError('Request has already been processed', 400));
      }

      await CollaborationRequestModel.reject(id, req.user.id, responseMessage);

      res.json({
        success: true,
        message: 'Collaboration request rejected'
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const { id } = req.params;

      // Only the hospital that created the request can cancel it
      const request = await CollaborationRequestModel.findById(id);
      if (!request) {
        return next(new AppError('Collaboration request not found', 404));
      }

      if (request.hospital_id !== req.user.organizationId) {
        return next(new AppError('Only the requesting hospital can cancel this request', 403));
      }

      if (request.status !== 'pending') {
        return next(new AppError('Only pending requests can be cancelled', 400));
      }

      await CollaborationRequestModel.cancel(id);

      res.json({
        success: true,
        message: 'Collaboration request cancelled'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CollaborationController;

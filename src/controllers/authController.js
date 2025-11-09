const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const { AppError } = require('../middleware/auth');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, username, password, firstName, lastName, role, organizationId, phone } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return next(new AppError('Email already registered', 400));
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return next(new AppError('Username already taken', 400));
        }

      // Create user
      const userId = await UserModel.create({
        email,
        username,
        password,
        firstName,
        lastName,
        role,
        organizationId,
        phone,
        status: 'pending_approval',
        createdBy: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Awaiting approval.',
        data: { userId }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return next(new AppError('Invalid email or password', 401));
      }

      // Check password
      const isPasswordValid = await UserModel.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return next(new AppError('Invalid email or password', 401));
      }

      // Check if user is active (block suspended, inactive, pending_approval)
      if (user.status === 'suspended') {
        return next(new AppError('Your account has been suspended. Please contact your administrator.', 403));
      }

      if (user.status !== 'active') {
        return next(new AppError('Your account is not active. Please contact administrator.', 403));
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, role: user.role, organizationId: user.organization_id, firstName: user.first_name, lastName: user.last_name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
      );

      // Remove password from response
      delete user.password;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            profileImageUrl: user.profile_image_url || null,
            role: user.role,
            organization: {
              id: user.organization_id,
              name: user.organization_name,
              code: user.organization_code,
              type: user.organization_type
            }
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(new AppError('Refresh token is required', 400));
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check if user is active
      if (user.status !== 'active') {
        return next(new AppError('Your account is not active', 403));
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { id: user.id, role: user.role, organizationId: user.organization_id, firstName: user.first_name, lastName: user.last_name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid refresh token', 401));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Refresh token has expired. Please log in again.', 401));
      }
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return next(new AppError('Email is required', 400));

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // For security don't reveal whether email exists; return success
        console.warn(`Forgot password requested for unknown email: ${email}`);
        return res.json({ success: true, message: 'If an account exists with that email, you will receive a reset link.' });
      }

      // Generate a short-lived JWT as a reset token (dev-friendly approach)
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In production you would persist the token and send an email. For now, log it for dev and return success.
      console.log(`Password reset token for user ${user.email}: ${resetToken}`);

      res.json({ success: true, message: 'If an account exists with that email, you will receive a reset link.' });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      delete user.password;

      // Normalize DB row (snake_case) to frontend-friendly camelCase shape
      const normalized = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        profileImageUrl: user.profile_image_url || null,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        organizationCode: user.organization_code,
        organizationType: user.organization_type,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        licenseNumber: user.license_number,
        specialization: user.specialization
      };

      res.json({
        success: true,
        data: { user: normalized }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;

      await UserModel.update(req.user.id, {
        firstName,
        lastName,
        phone
      });

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadProfileImage(req, res, next) {
    try {
      if (!req.file) {
        return next(new AppError('No file uploaded', 400));
      }

      const filename = req.file.filename;
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${filename}`;

      // Fetch current user to remove old image if present
      const existing = await UserModel.findById(req.user.id);
      if (existing && existing.profile_image_url) {
        try {
          const path = require('path');
          const fs = require('fs');
          const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'profiles');
          const old = existing.profile_image_url;
          // If stored as full URL, extract filename
          const oldFilename = old.includes('/uploads/profiles/') ? old.split('/uploads/profiles/').pop() : null;
          if (oldFilename) {
            const oldPath = path.join(uploadsDir, oldFilename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
        } catch (e) {
          // Log but don't block upload
          console.warn('Failed to remove old profile image:', e.message);
        }
      }

      // Persist new profile image URL
      try {
        await UserModel.update(req.user.id, { profileImageUrl: fileUrl });
      } catch (err) {
        // If the DB doesn't have the profile_image_url column, attempt to run the idempotent migration and retry once
        if (err && err.code === 'ER_BAD_FIELD_ERROR' && (err.message || '').includes('profile_image_url')) {
          try {
            console.warn('profile_image_url column missing. Attempting to run migration and retry update...');
            const migr = require('../database/alter-add-profile-image');
            if (migr && typeof migr.migrate === 'function') {
              await migr.migrate();
              // retry update after migration
              await UserModel.update(req.user.id, { profileImageUrl: fileUrl });
            } else {
              console.error('Migration module does not expose migrate()');
              throw err;
            }
          } catch (migErr) {
            console.error('Automatic migration attempt failed:', migErr.message || migErr);
            // rethrow the original DB error so error handler can surface it
            throw err;
          }
        } else {
          throw err;
        }
      }

      res.json({ success: true, data: { profileImageUrl: fileUrl } });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return next(new AppError('Current password and new password are required', 400));
      }

      if (newPassword.length < 6) {
        return next(new AppError('New password must be at least 6 characters long', 400));
      }

      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Verify current password
      const isValid = await UserModel.comparePassword(currentPassword, user.password);
      if (!isValid) {
        return next(new AppError('Current password is incorrect', 400));
      }

      // Update password
      await UserModel.update(req.user.id, { password: newPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

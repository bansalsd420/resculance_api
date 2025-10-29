const express = require('express');
const authRoutes = require('./authRoutes');
const organizationRoutes = require('./organizationRoutes');
const userRoutes = require('./userRoutes');
const ambulanceRoutes = require('./ambulanceRoutes');
const patientRoutes = require('./patientRoutes');
const collaborationRoutes = require('./collaborationRoutes');

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/ambulances', ambulanceRoutes);
router.use('/patients', patientRoutes);
router.use('/collaborations', collaborationRoutes);

module.exports = router;

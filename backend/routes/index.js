// backend/routes/index.js
const express = require('express');
const protocolRoutes = require('./protocolRoutes');
const portfolioRoutes = require('./portfolioRoutes');
const userRoutes = require('./userRoutes');
const taxRoutes = require('./taxRoutes');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.use('/protocols', protocolRoutes);
router.use('/auth', userRoutes.authRoutes);

// Routes protégées
router.use('/portfolio', authMiddleware, portfolioRoutes);
router.use('/user', authMiddleware, userRoutes.userRoutes);
router.use('/tax', authMiddleware, taxRoutes);

module.exports = router;
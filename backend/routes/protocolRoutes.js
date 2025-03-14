// backend/routes/protocolRoutes.js
const express = require('express');
const ProtocolController = require('../controllers/protocolController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/', ProtocolController.getAllProtocols);
router.get('/top', ProtocolController.getTopProtocolsByApy);
router.get('/safest', ProtocolController.getSafestProtocols);
router.get('/chain/:chain', ProtocolController.getProtocolsByChain);
router.get('/category/:category', ProtocolController.getProtocolsByCategory);
router.get('/:id', ProtocolController.getProtocolById);

// Routes protégées
router.post('/refresh', authMiddleware, ProtocolController.refreshProtocolData);
router.get('/:id/onchain', authMiddleware, ProtocolController.getOnChainData);

module.exports = router;
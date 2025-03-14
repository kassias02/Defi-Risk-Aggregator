// backend/routes/portfolioRoutes.js
const express = require('express');
const PortfolioController = require('../controllers/portfolioController');

const router = express.Router();

router.post('/optimize', PortfolioController.generateOptimizedPortfolio);
router.get('/user/:userId', PortfolioController.getUserPortfolio);
router.put('/user/:userId', PortfolioController.updateUserPortfolio);
router.post('/analyze', PortfolioController.analyzePortfolioRisk);
router.post('/simulate', PortfolioController.simulateMarketScenarios);
router.post('/rebalance', PortfolioController.rebalancePortfolio);

module.exports = router;
// backend/controllers/portfolioController.js
const User = require('../models/user');
const Protocol = require('../models/protocol');
const PortfolioOptimizerService = require('../services/portfolioOptimizerService');
const RiskAnalysisService = require('../services/riskAnalysisService');

class PortfolioController {
  async generateOptimizedPortfolio(req, res) {
    try {
      const { riskProfile, preferredChains, excludedProtocols } = req.body;
      if (!['low', 'medium', 'high'].includes(riskProfile)) {
        return res.status(400).json({ error: 'Profil de risque invalide' });
      }
      
      const optimizedPortfolio = await PortfolioOptimizerService.generateOptimizedPortfolio(
        riskProfile,
        preferredChains,
        excludedProtocols
      );
      res.json(optimizedPortfolio);
    } catch (error) {
      console.error('Erreur lors de la génération du portefeuille optimisé:', error);
      res.status(500).json({ error: 'Erreur lors de la génération du portefeuille optimisé' });
    }
  }
  
  async getUserPortfolio(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      
      const portfolio = user.portfolio || [];
      const enrichedPortfolio = await this.enrichPortfolioData(portfolio);
      res.json(enrichedPortfolio);
    } catch (error) {
      console.error('Erreur lors de la récupération du portefeuille de l\'utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du portefeuille de l\'utilisateur' });
    }
  }
  
  async enrichPortfolioData(portfolio) {
    const protocolIds = portfolio.map(p => p.protocolId);
    const protocols = await Protocol.find({ _id: { $in: protocolIds } });
    
    return portfolio.map(position => {
      const protocol = protocols.find(p => p._id.toString() === position.protocolId.toString());
      return {
        ...position,
        protocol: protocol || { name: 'Unknown Protocol' }
      };
    });
  }
  
  async updateUserPortfolio(req, res) {
    try {
      const { userId } = req.params;
      const { portfolio } = req.body;
      
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      
      user.portfolio = portfolio;
      await user.save();
      
      res.json({ message: 'Portefeuille mis à jour avec succès', portfolio });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du portefeuille:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du portefeuille' });
    }
  }
  
  async analyzePortfolioRisk(req, res) {
    try {
      const { portfolio } = req.body;
      if (!portfolio || !Array.isArray(portfolio)) {
        return res.status(400).json({ error: 'Portefeuille invalide' });
      }
      
      const riskAnalysis = await RiskAnalysisService.evaluatePortfolioRisk(portfolio);
      res.json(riskAnalysis);
    } catch (error) {
      console.error('Erreur lors de l\'analyse du risque du portefeuille:', error);
      res.status(500).json({ error: 'Erreur lors de l\'analyse du risque du portefeuille' });
    }
  }
  
  async simulateMarketScenarios(req, res) {
    try {
      const { portfolio } = req.body;
      if (!portfolio || !Array.isArray(portfolio)) {
        return res.status(400).json({ error: 'Portefeuille invalide' });
      }
      
      const scenarios = await RiskAnalysisService.simulateMarketScenarios(portfolio);
      res.json(scenarios);
    } catch (error) {
      console.error('Erreur lors de la simulation des scénarios de marché:', error);
      res.status(500).json({ error: 'Erreur lors de la simulation des scénarios de marché' });
    }
  }
  
  async rebalancePortfolio(req, res) {
    try {
      const { portfolio, userPreferences } = req.body;
      if (!portfolio || !Array.isArray(portfolio)) {
        return res.status(400).json({ error: 'Portefeuille invalide' });
      }
      
      const rebalancedPortfolio = await PortfolioOptimizerService.rebalancePortfolio(
        portfolio,
        userPreferences
      );
      res.json(rebalancedPortfolio);
    } catch (error) {
      console.error('Erreur lors du rééquilibrage du portefeuille:', error);
      res.status(500).json({ error: 'Erreur lors du rééquilibrage du portefeuille' });
    }
  }
}

module.exports = new PortfolioController();
// backend/services/portfolioOptimizerService.js
const Protocol = require('../models/protocol');
const RiskAnalysisService = require('./riskAnalysisService');

class PortfolioOptimizerService {
  async generateOptimizedPortfolio(riskProfile, preferredChains = [], excludedProtocols = []) {
    try {
      const riskToleranceScore = this.riskProfileToScore(riskProfile);
      let protocols = await Protocol.find({
        name: { $nin: excludedProtocols }
      });
      
      if (preferredChains.length > 0) {
        protocols = protocols.filter(p => preferredChains.includes(p.blockchain));
      }
      
      const allocations = await this.optimizePortfolio(protocols, riskToleranceScore);
      const portfolio = allocations.map(a => ({
        protocolId: a.protocol._id,
        allocation: a.weight
      }));
      
      const riskAnalysis = await RiskAnalysisService.evaluatePortfolioRisk(portfolio);
      
      return {
        portfolio: allocations,
        riskAnalysis,
        expectedAnnualReturn: this.calculateExpectedReturn(allocations),
        diversificationScore: 10 - riskAnalysis.riskFactors.concentrationRisk
      };
    } catch (error) {
      console.error('Erreur lors de l\'optimisation du portefeuille:', error);
      throw error;
    }
  }
  
  riskProfileToScore(riskProfile) {
    switch (riskProfile) {
      case 'low': return 3;
      case 'medium': return 5;
      case 'high': return 8;
      default: return 5;
    }
  }
  
  async optimizePortfolio(protocols, targetRiskScore) {
    const sortedProtocols = [...protocols].sort((a, b) => {
      const sharpeA = a.apy / a.riskScore;
      const sharpeB = b.apy / b.riskScore;
      return sharpeB - sharpeA;
    });
    
    const numProtocols = Math.max(3, Math.min(8, Math.round(targetRiskScore)));
    const selectedProtocols = sortedProtocols.slice(0, numProtocols);
    
    return this.createAllocations(selectedProtocols, targetRiskScore);
  }
  
  createAllocations(protocols, targetRiskScore) {
    let totalRiskAdjustedReturn = 0;
    protocols.forEach(protocol => {
      const riskAdjustedReturn = protocol.apy / Math.pow(protocol.riskScore, 2 - targetRiskScore / 10);
      totalRiskAdjustedReturn += riskAdjustedReturn;
      protocol.riskAdjustedReturn = riskAdjustedReturn;
    });
    
    const allocations = protocols.map(protocol => ({
      protocol,
      weight: (protocol.riskAdjustedReturn / totalRiskAdjustedReturn) * 100
    }));
    
    const totalWeight = allocations.reduce((sum, a) => sum + a.weight, 0);
    return allocations.map(a => ({
      protocol: a.protocol,
      weight: parseFloat((a.weight / totalWeight * 100).toFixed(2))
    }));
  }
  
  calculateExpectedReturn(allocations) {
    return allocations.reduce((total, a) => total + (a.protocol.apy * a.weight / 100), 0);
  }
  
  async rebalancePortfolio(currentPortfolio, userPreferences) {
    const protocolIds = currentPortfolio.map(p => p.protocolId);
    const protocols = await Protocol.find({ _id: { $in: protocolIds } });
    
    const riskyProtocols = protocols.filter(p => p.riskScore > userPreferences.riskThreshold);
    
    if (riskyProtocols.length > 0) {
      const alternatives = await this.findSaferAlternatives(riskyProtocols, userPreferences);
      return this.createRebalancedPortfolio(currentPortfolio, riskyProtocols, alternatives);
    }
    
    return this.optimizeExistingPortfolio(currentPortfolio, protocols, userPreferences);
  }
  
  async findSaferAlternatives(riskyProtocols, userPreferences) {
    const categories = riskyProtocols.map(p => p.category);
    const riskThreshold = userPreferences.riskThreshold;
    
    return await Protocol.find({
      category: { $in: categories },
      riskScore: { $lt: riskThreshold },
      name: { $nin: userPreferences.excludedProtocols || [] }
    }).sort({ apy: -1 }).limit(riskyProtocols.length * 2);
  }
  
  createRebalancedPortfolio(currentPortfolio, riskyProtocols, alternatives) {
    const newPortfolio = [...currentPortfolio];
    
    for (const riskyProtocol of riskyProtocols) {
      const index = newPortfolio.findIndex(p => p.protocolId.toString() === riskyProtocol._id.toString());
      if (index !== -1) {
        const allocation = newPortfolio[index].allocation;
        newPortfolio.splice(index, 1);
        
        const bestAlternative = alternatives.find(a => a.category === riskyProtocol.category);
        if (bestAlternative) {
          newPortfolio.push({
            protocolId: bestAlternative._id,
            allocation
          });
        } else {
          const remainingTotal = newPortfolio.reduce((sum, p) => sum + p.allocation, 0);
          for (let i = 0; i < newPortfolio.length; i++) {
            newPortfolio[i].allocation += (allocation * newPortfolio[i].allocation / remainingTotal);
          }
        }
      }
    }
    
    const total = newPortfolio.reduce((sum, p) => sum + p.allocation, 0);
    return newPortfolio.map(p => ({
      ...p,
      allocation: parseFloat((p.allocation / total * 100).toFixed(2))
    }));
  }
  
  async optimizeExistingPortfolio(currentPortfolio, protocols, userPreferences) {
    const currentRisk = await this.calculatePortfolioRisk(currentPortfolio, protocols);
    const highYieldProtocols = await Protocol.find({
      riskScore: { $lte: currentRisk * 1.1 },
      apy: { $gt: this.calculateAverageApy(protocols) },
      name: { $nin: userPreferences.excludedProtocols || [] }
    }).sort({ apy: -1 }).limit(3);
    
    if (highYieldProtocols.length > 0) {
      return this.integrateHighYieldProtocols(currentPortfolio, protocols, highYieldProtocols);
    }
    
    return currentPortfolio;
  }
  
  async calculatePortfolioRisk(portfolio, protocols) {
    let weightedRiskScore = 0;
    let totalWeight = 0;
    
    for (const position of portfolio) {
      const protocol = protocols.find(p => p._id.toString() === position.protocolId.toString());
      if (protocol) {
        weightedRiskScore += protocol.riskScore * position.allocation;
        totalWeight += position.allocation;
      }
    }
    
    return weightedRiskScore / totalWeight;
  }
  
  calculateAverageApy(protocols) {
    return protocols.reduce((sum, p) => sum + p.apy, 0) / protocols.length;
  }
  
  integrateHighYieldProtocols(currentPortfolio, currentProtocols, highYieldProtocols) {
    const newPortfolio = [...currentPortfolio];
    const reductionFactor = 0.8;
    for (let i = 0; i < newPortfolio.length; i++) {
      newPortfolio[i].allocation *= reductionFactor;
    }
    
    const availableAllocation = 100 - newPortfolio.reduce((sum, p) => sum + p.allocation, 0);
    const allocationPerProtocol = availableAllocation / highYieldProtocols.length;
    
    for (const protocol of highYieldProtocols) {
      newPortfolio.push({
        protocolId: protocol._id,
        allocation: allocationPerProtocol
      });
    }
    
    const total = newPortfolio.reduce((sum, p) => sum + p.allocation, 0);
    return newPortfolio.map(p => ({
      ...p,
      allocation: parseFloat((p.allocation / total * 100).toFixed(2))
    }));
  }
}

module.exports = new PortfolioOptimizerService();
// backend/services/riskAnalysisService.js
const Protocol = require('../models/protocol');

class RiskAnalysisService {
  async evaluatePortfolioRisk(protocols) {
    const riskFactors = {
      protocolRisk: await this.calculateProtocolRisk(protocols),
      chainDiversification: this.calculateChainDiversification(protocols),
      concentrationRisk: this.calculateConcentrationRisk(protocols),
      impermanentLossRisk: this.calculateImpermanentLossRisk(protocols),
      systemicRisk: await this.calculateSystemicRisk()
    };
    
    const weightedScore = 
      (riskFactors.protocolRisk * 0.3) +
      (riskFactors.chainDiversification * 0.2) +
      (riskFactors.concentrationRisk * 0.2) +
      (riskFactors.impermanentLossRisk * 0.1) +
      (riskFactors.systemicRisk * 0.2);
    
    return {
      totalRiskScore: weightedScore,
      riskLevel: this.getRiskLevel(weightedScore),
      riskFactors
    };
  }
  
  async calculateProtocolRisk(protocols) {
    const protocolIds = protocols.map(p => p.protocolId);
    const protocolData = await Protocol.find({ _id: { $in: protocolIds } });
    
    let totalWeightedRisk = 0;
    let totalWeight = 0;
    
    for (const protocol of protocols) {
      const data = protocolData.find(p => p._id.toString() === protocol.protocolId);
      if (data) {
        totalWeightedRisk += data.riskScore * protocol.allocation;
        totalWeight += protocol.allocation;
      }
    }
    
    return totalWeightedRisk / totalWeight;
  }
  
  calculateChainDiversification(protocols) {
    const chainAllocation = {};
    let totalAllocation = 0;
    
    for (const protocol of protocols) {
      chainAllocation[protocol.blockchain] = (chainAllocation[protocol.blockchain] || 0) + protocol.allocation;
      totalAllocation += protocol.allocation;
    }
    
    let hhi = 0;
    for (const chain in chainAllocation) {
      const percentage = chainAllocation[chain] / totalAllocation;
      hhi += percentage * percentage;
    }
    
    return 1 + 9 * hhi;
  }
  
  calculateConcentrationRisk(protocols) {
    const totalAllocation = protocols.reduce((sum, p) => sum + p.allocation, 0);
    let hhi = 0;
    for (const protocol of protocols) {
      const percentage = protocol.allocation / totalAllocation;
      hhi += percentage * percentage;
    }
    
    return 1 + 9 * hhi;
  }
  
  calculateImpermanentLossRisk(protocols) {
    let ilRisk = 0;
    for (const protocol of protocols) {
      if (protocol.category === 'dex' || protocol.category === 'yield farming') {
        ilRisk += protocol.allocation * 0.8;
      } else {
        ilRisk += protocol.allocation * 0.2;
      }
    }
    return ilRisk / protocols.reduce((sum, p) => sum + p.allocation, 0);
  }
  
  async calculateSystemicRisk() {
    const marketCondition = await this.getMarketCondition();
    return marketCondition.riskScore;
  }
  
  async getMarketCondition() {
    return {
      riskScore: 5,
      fearGreedIndex: 45,
      volatilityIndex: 60,
      trendDirection: 'neutral'
    };
  }
  
  getRiskLevel(score) {
    if (score < 3) return 'very low';
    if (score < 5) return 'low';
    if (score < 7) return 'medium';
    if (score < 8.5) return 'high';
    return 'very high';
  }
  
  async simulateMarketScenarios(portfolio) {
    return {
      baseline: await this.calculatePortfolioPerformance(portfolio, 'baseline'),
      bullMarket: await this.calculatePortfolioPerformance(portfolio, 'bull'),
      bearMarket: await this.calculatePortfolioPerformance(portfolio, 'bear'),
      protocolHack: await this.simulateProtocolHack(portfolio),
      liquidityCrisis: await this.simulateLiquidityCrisis(portfolio)
    };
  }
  
  async calculatePortfolioPerformance(portfolio, scenario) {
    let performanceMultiplier;
    switch (scenario) {
      case 'bull': performanceMultiplier = 1.5; break;
      case 'bear': performanceMultiplier = 0.6; break;
      default: performanceMultiplier = 1.0;
    }
    
    let totalReturn = 0;
    for (const position of portfolio) {
      const protocol = await Protocol.findById(position.protocolId);
      const adjustedApy = protocol.apy * performanceMultiplier;
      totalReturn += position.allocation * adjustedApy / 100;
    }
    
    return { annualizedReturn: totalReturn, scenario };
  }
  
  async simulateProtocolHack(portfolio) {
    const protocols = await Promise.all(
      portfolio.map(async position => {
        const protocol = await Protocol.findById(position.protocolId);
        return { ...position, riskScore: protocol.riskScore };
      })
    );
    
    const riskiestProtocol = protocols.reduce(
      (riskiest, current) => current.riskScore > riskiest.riskScore ? current : riskiest,
      { riskScore: 0 }
    );
    
    const impactPercentage = -0.8;
    const portfolioImpact = riskiestProtocol.allocation * impactPercentage;
    
    return {
      scenario: 'protocol hack',
      impactedProtocol: riskiestProtocol.protocolId,
      portfolioImpact,
      recommendedAction: 'Diversify away from high-risk protocols'
    };
  }
  
  async simulateLiquidityCrisis(portfolio) {
    return {
      scenario: 'liquidity crisis',
      portfolioImpact: -0.3,
      worstAffectedCategories: ['dex', 'lending'],
      recommendedAction: 'Increase allocation to protocols with deep liquidity'
    };
  }
}

module.exports = new RiskAnalysisService();
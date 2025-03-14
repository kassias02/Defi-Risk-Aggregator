// backend/services/protocolService.js
const Protocol = require('../models/protocol');
const axios = require('axios');
const ethers = require('ethers');
const config = require('../config');

class ProtocolService {
  async fetchProtocolData() {
    try {
      const defiLlamaResponse = await axios.get('https://api.llama.fi/protocols');
      const coingeckoResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: 'ethereum,bitcoin,solana,avalanche-2',
          order: 'market_cap_desc'
        }
      });
      
      const protocols = await this.processProtocolData(defiLlamaResponse.data, coingeckoResponse.data);
      
      for (const protocol of protocols) {
        await Protocol.findOneAndUpdate(
          { name: protocol.name },
          protocol,
          { upsert: true, new: true }
        );
      }
      
      return protocols;
    } catch (error) {
      console.error('Erreur lors de la récupération des données des protocoles:', error);
      throw error;
    }
  }
  
  async processProtocolData(defiLlamaData, coinData) {
    const processedData = defiLlamaData.map(protocol => {
      const riskScore = this.calculateRiskScore(protocol);
      
      return {
        name: protocol.name,
        blockchain: protocol.chain,
        tvl: protocol.tvl,
        apy: this.estimateAPY(protocol),
        riskScore,
        contractAddresses: { main: protocol.address || '0x' },
        category: protocol.category,
        url: protocol.url,
        metrics: {
          collateralizationRatio: protocol.chainTvls ? this.calculateCollateralizationRatio(protocol) : null,
          utilizationRate: this.calculateUtilizationRate(protocol),
          volatilityIndex: this.calculateVolatilityIndex(protocol, coinData),
          liquidityDepth: protocol.tvl / 1000000
        }
      };
    });
    
    return processedData;
  }
  
  calculateRiskScore(protocol) {
    let score = 5;
    if (protocol.tvl > 1000000000) score -= 1;
    if (protocol.audit) score -= 1;
    if (new Date() - new Date(protocol.date) > 31536000000) score -= 1;
    if (protocol.tvl < 10000000) score += 1;
    if (!protocol.audit) score += 2;
    if (new Date() - new Date(protocol.date) < 7776000000) score += 1;
    return Math.max(1, Math.min(10, score));
  }
  
  estimateAPY(protocol) {
    return Math.random() * 20; // Simplifié pour l'exemple
  }
  
  calculateCollateralizationRatio(protocol) {
    return protocol.tvl / (protocol.borrowed || protocol.tvl * 0.7);
  }
  
  calculateUtilizationRate(protocol) {
    return Math.random() * 0.8;
  }
  
  calculateVolatilityIndex(protocol, coinData) {
    return Math.random() * 100;
  }
  
  async getProtocolOnChainData(protocolAddress, blockchain) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(config.rpcEndpoints[blockchain]);
      // Exemple simplifié - à personnaliser selon les protocoles
      const contract = new ethers.Contract(protocolAddress, ['function totalSupply() view returns (uint256)'], provider);
      const totalSupply = await contract.totalSupply();
      return { totalSupply: ethers.utils.formatEther(totalSupply) };
    } catch (error) {
      console.error('Erreur lors de la récupération des données on-chain:', error);
      throw error;
    }
  }
}

module.exports = new ProtocolService();
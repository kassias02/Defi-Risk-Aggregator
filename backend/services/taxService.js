// backend/services/taxService.js
const User = require('../models/user');
const Protocol = require('../models/protocol');
const ethers = require('ethers');
const config = require('../config');

class TaxService {
  // Génère un rapport fiscal pour un utilisateur
  async generateTaxReport(userId, startDate, endDate) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const transactions = await this.fetchUserTransactions(user.walletAddresses, startDate, endDate);
      const report = this.processTransactions(transactions);

      return report;
    } catch (error) {
      console.error('Error generating tax report:', error);
      throw error;
    }
  }

// backend/services/taxService.js (corrected fetchUserTransactions)
async fetchUserTransactions(walletAddresses, startDate, endDate) {
  const transactions = [];
  
  for (const address of walletAddresses) {
    for (const chain in config.rpcEndpoints) {
      const provider = new ethers.providers.JsonRpcProvider(config.rpcEndpoints[chain]);
      
      try {
        const history = await provider.getHistory(address, startDate, endDate);
        for (const tx of history) {
          const block = await provider.getBlock(tx.blockNumber);
          transactions.push({
            chain,
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.utils.formatEther(tx.value),
            timestamp: block.timestamp,
            type: this.determineTransactionType(tx)
          });
        }
      } catch (error) {
        console.error(`Error fetching transactions for ${chain}:`, error);
      }
    }
  }

  return transactions.sort((a, b) => a.timestamp - b.timestamp);
}

  // Détermine le type de transaction
  determineTransactionType(tx) {
    // Logique simplifiée - à affiner avec les données réelles des protocoles
    if (tx.data && tx.data !== '0x') return 'contract_interaction'; // Interaction avec un smart contract
    if (tx.value.gt(0)) return 'transfer';
    return 'unknown';
  }

  // Traite les transactions pour générer un rapport fiscal
  processTransactions(transactions) {
    let totalGainLoss = 0;
    const realized = [];
    const unrealized = [];

    transactions.forEach(tx => {
      // Logique simplifiée pour le calcul des gains/pertes
      const valueUSD = parseFloat(tx.value) * 2000; // Prix ETH fictif de 2000 USD
      if (tx.type === 'transfer' && tx.from.toLowerCase() === tx.to.toLowerCase()) {
        unrealized.push({
          transaction: tx.hash,
          valueUSD,
          timestamp: tx.timestamp
        });
      } else if (tx.type === 'contract_interaction') {
        const gainLoss = valueUSD * (Math.random() > 0.5 ? 1 : -1); // Simulation
        totalGainLoss += gainLoss;
        realized.push({
          transaction: tx.hash,
          gainLoss,
          timestamp: tx.timestamp
        });
      }
    });

    return {
      totalGainLoss,
      realized,
      unrealized,
      generatedAt: new Date()
    };
  }

  // Exporte le rapport au format demandé
  async exportTaxReport(report, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report);
      case 'pdf':
        // Nécessiterait une bibliothèque comme pdfkit - implémentation à ajouter
        return 'PDF export not implemented yet';
      default:
        throw new Error('Unsupported export format');
    }
  }

  // Convertit le rapport en CSV
  convertToCSV(report) {
    let csv = 'Type,Transaction Hash,Gain/Loss (USD),Timestamp\n';
    
    report.realized.forEach(tx => {
      csv += `Realized,${tx.transaction},${tx.gainLoss.toFixed(2)},${new Date(tx.timestamp * 1000).toISOString()}\n`;
    });
    
    report.unrealized.forEach(tx => {
      csv += `Unrealized,${tx.transaction},${tx.valueUSD.toFixed(2)},${new Date(tx.timestamp * 1000).toISOString()}\n`;
    });
    
    csv += `\nTotal Gain/Loss,,${report.totalGainLoss.toFixed(2)},${new Date(report.generatedAt).toISOString()}`;
    return csv;
  }
}

module.exports = new TaxService();
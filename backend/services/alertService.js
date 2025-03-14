// backend/services/alertService.js
const Protocol = require('../models/protocol');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const config = require('../config');

class AlertService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }
  
  async monitorRiskChanges() {
    try {
      const protocols = await Protocol.find({});
      const significantChanges = [];
      
      for (const protocol of protocols) {
        const previousRiskScore = protocol.previousRiskScore || protocol.riskScore;
        if (Math.abs(protocol.riskScore - previousRiskScore) >= 1) {
          significantChanges.push({
            protocol,
            previousScore: previousRiskScore,
            newScore: protocol.riskScore,
            change: protocol.riskScore - previousRiskScore
          });
          
          protocol.previousRiskScore = protocol.riskScore;
          await protocol.save();
        }
      }
      
      if (significantChanges.length > 0) {
        await this.sendRiskAlerts(significantChanges);
      }
      
      return significantChanges;
    } catch (error) {
      console.error('Erreur lors de la surveillance des changements de risque:', error);
      throw error;
    }
  }
  
  async sendRiskAlerts(riskChanges) {
    try {
      const users = await User.find({ 'alertSettings.emailAlerts': true });
      
      for (const user of users) {
        const relevantChanges = riskChanges.filter(change => {
          if (user.riskProfile.excludedProtocols.includes(change.protocol.name)) return false;
          return change.newScore > user.alertSettings.riskThreshold;
        });
        
        if (relevantChanges.length > 0) {
          await this.sendRiskAlertEmail(user, relevantChanges);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des alertes de risque:', error);
      throw error;
    }
  }
  
  async sendRiskAlertEmail(user, riskChanges) {
    try {
      let emailContent = '<h2>Alert: DeFi Risk Level Changes</h2>';
      emailContent += '<p>The following protocols have experienced significant risk changes:</p><ul>';
      for (const change of riskChanges) {
        const riskDirection = change.change > 0 ? 'increased' : 'decreased';
        emailContent += `<li><strong>${change.protocol.name}</strong>: Risk has ${riskDirection} from ${change.previousScore} to ${change.newScore}</li>`;
      }
      emailContent += '</ul><p>You may want to review your portfolio allocation.</p>';
      emailContent += '<p>Click <a href="https://your-app-url.com/portfolio">here</a> to review your portfolio.</p>';
      
      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: 'DeFi Risk Alert: Protocol Risk Levels Have Changed',
        html: emailContent
      };
      
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email d\'alerte:', error);
      throw error;
    }
  }
  
  async monitorYieldOpportunities() {
    try {
      const protocols = await Protocol.find({}).sort({ apy: -1 });
      const opportunities = protocols.filter(p => p.riskScore <= 6).slice(0, 5);
      
      if (opportunities.length > 0) {
        await this.sendYieldAlerts(opportunities);
      }
      
      return opportunities;
    } catch (error) {
      console.error('Erreur lors de la surveillance des opportunités de rendement:', error);
      throw error;
    }
  }
  
  async sendYieldAlerts(opportunities) {
    try {
      const users = await User.find({
        'alertSettings.emailAlerts': true,
        'alertSettings.yieldThreshold': { $lte: opportunities[0].apy }
      });
      
      for (const user of users) {
        const relevantOpportunities = opportunities.filter(opp => {
          if (user.riskProfile.excludedProtocols.includes(opp.name)) return false;
          return opp.apy > user.alertSettings.yieldThreshold;
        });
        
        if (relevantOpportunities.length > 0) {
          await this.sendYieldAlertEmail(user, relevantOpportunities);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des alertes de rendement:', error);
      throw error;
    }
  }
  
  async sendYieldAlertEmail(user, opportunities) {
    try {
      let emailContent = '<h2>Alert: High Yield Opportunities</h2>';
      emailContent += '<p>We\'ve identified these high-yield opportunities:</p><ul>';
      for (const opp of opportunities) {
        emailContent += `<li><strong>${opp.name} (${opp.blockchain})</strong>: ${opp.apy.toFixed(2)}% APY with risk score ${opp.riskScore}/10</li>`;
      }
      emailContent += '</ul><p>Click <a href="https://your-app-url.com/opportunities">here</a> to review these opportunities.</p>';
      
      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: 'DeFi Alert: High Yield Opportunities Available',
        html: emailContent
      };
      
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email d\'opportunité:', error);
      throw error;
    }
  }
}

module.exports = new AlertService();
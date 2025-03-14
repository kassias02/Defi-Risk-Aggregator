// backend/controllers/protocolController.js
const Protocol = require('../models/protocol');
const ProtocolService = require('../services/protocolService');

class ProtocolController {
  async getAllProtocols(req, res) {
    try {
      const protocols = await Protocol.find({});
      res.json(protocols);
    } catch (error) {
      console.error('Erreur lors de la récupération des protocoles:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des protocoles' });
    }
  }
  
  async getProtocolById(req, res) {
    try {
      const protocol = await Protocol.findById(req.params.id);
      if (!protocol) return res.status(404).json({ error: 'Protocole non trouvé' });
      res.json(protocol);
    } catch (error) {
      console.error('Erreur lors de la récupération du protocole:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du protocole' });
    }
  }
  
  async getProtocolsByChain(req, res) {
    try {
      const { chain } = req.params;
      const protocols = await Protocol.find({ blockchain: chain });
      res.json(protocols);
    } catch (error) {
      console.error('Erreur lors de la récupération des protocoles par chaîne:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des protocoles par chaîne' });
    }
  }
  
  async getProtocolsByCategory(req, res) {
    try {
      const { category } = req.params;
      const protocols = await Protocol.find({ category });
      res.json(protocols);
    } catch (error) {
      console.error('Erreur lors de la récupération des protocoles par catégorie:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des protocoles par catégorie' });
    }
  }
  
  async getTopProtocolsByApy(req, res) {
    try {
      const { limit = 10 } = req.query;
      const protocols = await Protocol.find({}).sort({ apy: -1 }).limit(parseInt(limit));
      res.json(protocols);
    } catch (error) {
      console.error('Erreur lors de la récupération des meilleurs protocoles par APY:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des meilleurs protocoles par APY' });
    }
  }
  
  async getSafestProtocols(req, res) {
    try {
      const { limit = 10 } = req.query;
      const protocols = await Protocol.find({}).sort({ riskScore: 1, apy: -1 }).limit(parseInt(limit));
      res.json(protocols);
    } catch (error) {
      console.error('Erreur lors de la récupération des protocoles les plus sûrs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des protocoles les plus sûrs' });
    }
  }
  
  async refreshProtocolData(req, res) {
    try {
      const protocols = await ProtocolService.fetchProtocolData();
      res.json({ message: 'Données des protocoles actualisées avec succès', count: protocols.length });
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des données des protocoles:', error);
      res.status(500).json({ error: 'Erreur lors de l\'actualisation des données des protocoles' });
    }
  }
  
  async getOnChainData(req, res) {
    try {
      const { id } = req.params;
      const protocol = await Protocol.findById(id);
      if (!protocol) return res.status(404).json({ error: 'Protocole non trouvé' });
      
      const onChainData = await ProtocolService.getProtocolOnChainData(
        protocol.contractAddresses.main,
        protocol.blockchain
      );
      res.json(onChainData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données on-chain:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des données on-chain' });
    }
  }
}

module.exports = new ProtocolController();
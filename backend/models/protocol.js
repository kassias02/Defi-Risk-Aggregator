// backend/models/protocol.js
const mongoose = require('mongoose');

const ProtocolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  blockchain: { type: String, required: true },
  tvl: { type: Number, required: true },
  apy: { type: Number, required: true },
  riskScore: { type: Number, required: true },
  securityAudit: { type: Boolean, default: false },
  auditors: [String],
  lastIncident: Date,
  contractAddresses: {
    type: Map,
    of: String
  },
  category: { type: String, required: true }, // lending, dex, yield farming, etc.
  url: String,
  lastUpdated: { type: Date, default: Date.now },
  metrics: {
    collateralizationRatio: Number,
    utilizationRate: Number,
    volatilityIndex: Number,
    liquidityDepth: Number
  },
  previousRiskScore: Number // Pour suivre les changements de risque
});

module.exports = mongoose.model('Protocol', ProtocolSchema);
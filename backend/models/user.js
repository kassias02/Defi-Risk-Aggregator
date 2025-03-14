// backend/models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddresses: [String],
  riskProfile: {
    tolerance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    preferredChains: [String],
    preferredCategories: [String],
    excludedProtocols: [String]
  },
  alertSettings: {
    emailAlerts: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: false },
    riskThreshold: { type: Number, default: 7 }, // Sur une échelle de 1-10
    yieldThreshold: { type: Number, default: 5 } // Pourcentage minimal d'APY
  },
  portfolio: [{
    protocolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Protocol' },
    allocation: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

// Hash password avant de sauvegarder
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
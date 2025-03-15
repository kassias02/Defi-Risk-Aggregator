// backend/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddresses: [String],
  portfolio: [{ protocol: String, percentage: Number }]
});

module.exports = mongoose.model('User', userSchema);
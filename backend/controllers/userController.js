const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const protocolData = {
  'eth': { securityScore: 8, tvl: 10000000000, health: 'Stable', apy: 4 },
  'aave': { securityScore: 9, tvl: 5000000000, health: 'Strong', apy: 6 },
  'bizarre': { securityScore: 4, tvl: 1000000, health: 'Risky', apy: 10 }
};

const optimizePortfolio = (portfolio) => {
  const totalPercentage = portfolio.reduce((sum, item) => sum + Number(item.percentage), 0);
  if (totalPercentage === 0) return { suggestions: [], targetRisk: 0, targetYield: 0 };

  const currentRisk = portfolio.reduce((sum, item) => {
    const proto = protocolData[item.protocol.toLowerCase().trim()] || { securityScore: 5, apy: 0 };
    return sum + (10 - proto.securityScore) * (item.percentage / 100);
  }, 0);
  const currentYield = portfolio.reduce((sum, item) => {
    const proto = protocolData[item.protocol.toLowerCase().trim()] || { apy: 0 };
    return sum + proto.apy * (item.percentage / 100);
  }, 0);

  const suggestions = [];
  let targetRisk = currentRisk;
  let targetYield = currentYield;
  let remainingCapacity = 100 - totalPercentage;

  portfolio.forEach(item => {
    const proto = protocolData[item.protocol.toLowerCase().trim()] || { securityScore: 5, apy: 0 };
    const riskImpact = 10 - proto.securityScore;
    const currentPerc = Number(item.percentage);
    if (riskImpact >= 5 && currentPerc > 0) {
      const reduceBy = Math.min(currentPerc, 10);
      suggestions.push(`Reduce ${item.protocol.trim()} by ${reduceBy}% (Risk: ${riskImpact}/10)`);
      targetRisk -= riskImpact * (reduceBy / 100);
      targetYield -= proto.apy * (reduceBy / 100);
      remainingCapacity += reduceBy;
    }
  });

  let bestProto = null;
  let bestScore = -Infinity;
  Object.keys(protocolData).forEach(proto => {
    const current = portfolio.find(p => p.protocol.toLowerCase().trim() === proto) || { percentage: 0 };
    const currentPerc = Number(current.percentage);
    const { securityScore, apy } = protocolData[proto];
    const riskImpact = 10 - securityScore;
    const score = apy - riskImpact;
    if (apy > currentYield / totalPercentage && riskImpact < 5 && currentPerc < 50 && remainingCapacity > 0) {
      if (score > bestScore) {
        bestScore = score;
        bestProto = proto;
      }
    }
  });

  if (bestProto) {
    const current = portfolio.find(p => p.protocol.toLowerCase().trim() === bestProto) || { percentage: 0 };
    const currentPerc = Number(current.percentage);
    const { securityScore, apy } = protocolData[bestProto];
    const riskImpact = 10 - securityScore;
    const increaseBy = Math.min(10, remainingCapacity);
    suggestions.push(`Increase ${bestProto} by ${increaseBy}% (APY: ${apy}%)`);
    targetRisk += riskImpact * (increaseBy / 100);
    targetYield += apy * (increaseBy / 100);
  }

  return { suggestions, targetRisk: targetRisk.toFixed(2), targetYield: targetYield.toFixed(2) };
};

module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'Invalid email or password' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid email or password' });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },
  register: async (req, res) => {
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: 'User already exists' });
      user = new User({
        email,
        password: await bcrypt.hash(password, 10),
        walletAddresses: [],
        portfolio: []
      });
      await user.save();
      res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },
  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      const optimization = optimizePortfolio(user.portfolio);
      res.json({ ...user._doc, protocolData, optimization });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },
  addPortfolioItem: async (req, res) => {
    const { protocol, percentage } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      user.portfolio.push({ protocol, percentage });
      await user.save();
      res.json({ msg: 'Portfolio item added', portfolio: user.portfolio });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },
  deletePortfolioItem: async (req, res) => {
    const { index } = req.params;
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      if (index < 0 || index >= user.portfolio.length) {
        return res.status(400).json({ msg: 'Invalid index' });
      }
      user.portfolio.splice(index, 1);
      await user.save();
      res.json({ msg: 'Portfolio item deleted', portfolio: user.portfolio });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },
  addWallet: async (req, res) => {
    const { address } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      if (user.walletAddresses.includes(address)) {
        return res.status(400).json({ msg: 'Wallet address already added' });
      }
      user.walletAddresses.push(address);
      await user.save();
      res.json({ msg: 'Wallet added', walletAddresses: user.walletAddresses });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },
  deleteWallet: async (req, res) => {
    const { index } = req.params;
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      if (index < 0 || index >= user.walletAddresses.length) {
        return res.status(400).json({ msg: 'Invalid index' });
      }
      user.walletAddresses.splice(index, 1);
      await user.save();
      res.json({ msg: 'Wallet deleted', walletAddresses: user.walletAddresses });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
};
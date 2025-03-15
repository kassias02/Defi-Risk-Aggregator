const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
      res.json(user);
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
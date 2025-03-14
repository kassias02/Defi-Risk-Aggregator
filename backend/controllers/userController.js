// backend/controllers/userController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid email or password' });

      const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
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
      res.status(500).json({ msg: 'Server error' });
    }
  }
};
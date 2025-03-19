const axios = require('axios');
const jwt = require('jsonwebtoken');

// Mock user data (replace with actual DB in production)
let users = {
  'hassan2@gmail.com': {
    email: 'hassan2@gmail.com',
    password: 'hassan2', // In production, hash this!
    portfolio: [
      { protocol: 'eth', percentage: 20 },
      { protocol: 'Aave', percentage: 30 },
      { protocol: 'bizarre', percentage: 10 }
    ],
    walletAddresses: [
      '0xfaff6684dcD549BcF8733773eeCfa01D91286453',
      '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3',
      '0x9d89Da19D12Cd7C52A3492f23679495Af9e1cADC',
      '4VztozdDL8yFPLdpUpMNT3Hf7xMZ2qPGAMretExTvZ78'
    ],
    optimization: {
      suggestions: [
        'Reduce bizarre by 10% (Risk: 6/10)',
        'Increase aave by 10% (APY: 6%)'
      ],
      targetRisk: 0.80,
      targetYield: 3.20
    }
  }
};

// Fetch real yield data from DeFiLlama
const fetchYieldData = async () => {
  try {
    const response = await axios.get('https://api.llama.fi/protocols');
    const protocols = response.data.reduce((acc, p) => {
      const apy = p.apy || p.apyBase || 0; // Use apy or apyBase if available
      acc[p.name.toLowerCase()] = {
        securityScore: p.securityScore || 5, // Default if not provided
        tvl: p.tvl || 0,
        health: p.tvl > 1e9 ? 'Strong' : p.tvl > 1e8 ? 'Stable' : 'Risky',
        apy: apy > 0 ? Number(apy.toFixed(2)) : 0 // Cap at 2 decimals
      };
      return acc;
    }, {});
    // Add ETH as a base asset (mock data since not in DeFiLlama)
    protocols['eth'] = { securityScore: 8, tvl: 1e10, health: 'Stable', apy: 3 };
    return protocols;
  } catch (error) {
    console.error('Error fetching yield data:', error);
    // Fallback mock data
    return {
      eth: { securityScore: 8, tvl: 1e10, health: 'Stable', apy: 3 },
      aave: { securityScore: 9, tvl: 5e9, health: 'Strong', apy: 5 },
      bizarre: { securityScore: 4, tvl: 1e6, health: 'Risky', apy: 10 }
    };
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (user && user.password === password) {
    const token = jwt.sign({ email }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

exports.getUser = async (req, res) => {
  const email = req.user.email;
  const user = users[email];
  if (!user) return res.status(404).json({ message: 'User not found' });

  const protocolData = await fetchYieldData();
  res.json({ ...user, protocolData });
};

exports.addPortfolioItem = async (req, res) => {
  const email = req.user.email;
  const { protocol, percentage } = req.body;
  if (!users[email].portfolio) users[email].portfolio = [];
  users[email].portfolio.push({ protocol, percentage: Number(percentage) });
  const protocolData = await fetchYieldData();
  res.json({ ...users[email], protocolData });
};

exports.deletePortfolioItem = async (req, res) => {
  const email = req.user.email;
  const index = req.params.index;
  users[email].portfolio.splice(index, 1);
  const protocolData = await fetchYieldData();
  res.json({ ...users[email], protocolData });
};

exports.addWallet = async (req, res) => {
  const email = req.user.email;
  const { address } = req.body;
  if (!users[email].walletAddresses) users[email].walletAddresses = [];
  users[email].walletAddresses.push(address);
  const protocolData = await fetchYieldData();
  res.json({ ...users[email], protocolData });
};

exports.deleteWallet = async (req, res) => {
  const email = req.user.email;
  const index = req.params.index;
  users[email].walletAddresses.splice(index, 1);
  const protocolData = await fetchYieldData();
  res.json({ ...users[email], protocolData });
};
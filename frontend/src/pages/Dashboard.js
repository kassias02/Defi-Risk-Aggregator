import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import api from '../services/api';
import '../styles.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [protocol, setProtocol] = useState('');
  const [percentage, setPercentage] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userResponse = await api.get('/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const rpcResponse = await api.get('/rpc');
        const ethProvider = new ethers.JsonRpcProvider(rpcResponse.data.rpcUrl);
        const solRpcs = [
          process.env.REACT_APP_SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
          'https://api.mainnet-beta.solana.com',
          'https://solana-api.projectserum.com'
        ];

        const user = userResponse.data;
        const walletBalances = {};
        for (const address of user.walletAddresses) {
          walletBalances[address] = { status: 'Fetching...' };
          setBalances((prev) => ({ ...prev, [address]: { status: 'Fetching...' } }));
          try {
            if (ethers.isAddress(address)) {
              const ethBalance = await ethProvider.getBalance(address);
              walletBalances[address] = { eth: ethers.formatEther(ethBalance) };
            } else if (address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
              let solBalance;
              for (const rpc of solRpcs) {
                try {
                  const connection = new Connection(rpc, 'confirmed');
                  const publicKey = new PublicKey(address);
                  solBalance = await connection.getBalance(publicKey);
                  break;
                } catch (rpcErr) {
                  console.warn(`Solana RPC ${rpc} failed:`, rpcErr);
                  if (rpc === solRpcs[solRpcs.length - 1]) throw rpcErr;
                }
              }
              walletBalances[address] = { sol: solBalance / 1e9 };
            } else {
              walletBalances[address] = { error: 'Unsupported Address' };
            }
          } catch (err) {
            walletBalances[address] = { error: `Fetch Error: ${err.message}` };
            console.error(`Error fetching balance for ${address}:`, err);
          }
          setBalances((prev) => ({ ...prev, ...walletBalances }));
        }
        setUserData(user);
      } catch (err) {
        console.error('Fetch error:', err.message || err);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/portfolio', { protocol, percentage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = await api.get('/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(updatedUser.data);
      setProtocol('');
      setPercentage('');
    } catch (err) {
      console.error('Add portfolio error:', err.message || err);
      alert('Failed to add portfolio item: ' + (err.response?.data?.msg || 'Unknown error'));
    }
  };

  const handleDeletePortfolio = async (index) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/portfolio/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = await api.get('/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(updatedUser.data);
    } catch (err) {
      console.error('Delete portfolio error:', err.message || err);
      alert('Failed to delete portfolio item: ' + (err.response?.data?.msg || 'Unknown error'));
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/wallet', { address: walletAddress }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ethProvider = new ethers.JsonRpcProvider((await api.get('/rpc')).data.rpcUrl);
      const solRpcs = [
        process.env.REACT_APP_SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com'
      ];

      const newBalances = { ...balances, [walletAddress]: { status: 'Fetching...' } };
      setBalances(newBalances);

      if (ethers.isAddress(walletAddress)) {
        const ethBalance = await ethProvider.getBalance(walletAddress);
        newBalances[walletAddress] = { eth: ethers.formatEther(ethBalance) };
      } else if (walletAddress.length >= 32 && walletAddress.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)) {
        let solBalance;
        for (const rpc of solRpcs) {
          try {
            const connection = new Connection(rpc, 'confirmed');
            const publicKey = new PublicKey(walletAddress);
            solBalance = await connection.getBalance(publicKey);
            break;
          } catch (rpcErr) {
            console.warn(`Solana RPC ${rpc} failed:`, rpcErr);
            if (rpc === solRpcs[solRpcs.length - 1]) throw rpcErr;
          }
        }
        newBalances[walletAddress] = { sol: solBalance / 1e9 };
      } else {
        newBalances[walletAddress] = { error: 'Unsupported Address' };
      }
      setBalances(newBalances);
      setUserData({ ...userData, walletAddresses: response.data.walletAddresses });
      setWalletAddress('');
    } catch (err) {
      console.error('Add wallet error:', err.message || err);
      alert('Failed to add wallet: ' + (err.response?.data?.msg || err.message || 'Unknown error'));
    }
  };

  const handleDeleteWallet = async (index) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/wallet/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newBalances = { ...balances };
      delete newBalances[userData.walletAddresses[index]];
      setBalances(newBalances);
      setUserData({ ...userData, walletAddresses: response.data.walletAddresses });
    } catch (err) {
      console.error('Delete wallet error:', err.message || err);
      alert('Failed to delete wallet: ' + (err.response?.data?.msg || 'Unknown error'));
    }
  };

  const calculateRiskScore = () => {
    if (!userData || !userData.portfolio.length) return { level: 'N/A', score: 0 };
    let totalRiskScore = 0;
    let totalPercentage = 0;
    userData.portfolio.forEach(item => {
      const protoData = userData.protocolData[item.protocol.toLowerCase()] || { securityScore: 5, tvl: 0 };
      const riskFactor = (10 - protoData.securityScore) * (item.percentage / 100);
      totalRiskScore += riskFactor;
      totalPercentage += Number(item.percentage);
    });
    const walletRisk = Object.values(balances).reduce((sum, bal) => 
      sum + ((bal.eth && Number(bal.eth) > 0.1) || (bal.sol && bal.sol > 10) ? 2 : 0), 0);
    totalRiskScore += walletRisk;

    if (totalPercentage > 100 || totalRiskScore > 7) return { level: 'High Risk', score: totalRiskScore };
    if (totalPercentage > 50 || totalRiskScore > 3) return { level: 'Moderate Risk', score: totalRiskScore };
    return { level: 'Low Risk', score: totalRiskScore };
  };

  if (!userData) return <div>Loading...</div>;

  const risk = calculateRiskScore();

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <p>Welcome, {userData.email}!</p>

      <h3>Add Portfolio Item</h3>
      <form onSubmit={handleAddPortfolio} className="portfolio-form">
        <input
          type="text"
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
          placeholder="Protocol (e.g., Aave)"
          required
          className="auth-input"
        />
        <input
          type="number"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          placeholder="Percentage (0-100)"
          min="0"
          max="100"
          required
          className="auth-input"
        />
        <button type="submit" className="auth-button">Add Item</button>
      </form>

      <h3>Add Wallet Address</h3>
      <form onSubmit={handleAddWallet} className="portfolio-form">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Wallet Address (e.g., 0x... or Solana)"
          required
          className="auth-input"
        />
        <button type="submit" className="auth-button">Add Wallet</button>
      </form>

      <h3>Your Portfolio</h3>
      {userData.portfolio.length > 0 ? (
        <ul>
          {userData.portfolio.map((item, index) => {
            const protoData = userData.protocolData[item.protocol.toLowerCase()] || { securityScore: 5, tvl: 0, health: 'Unknown', apy: 0 };
            return (
              <li key={index}>
                {item.protocol}: {item.percentage}% 
                (Security: {protoData.securityScore}/10, TVL: ${(protoData.tvl / 1e9).toFixed(1)}B, Health: {protoData.health}, APY: {protoData.apy}%)
                <button
                  onClick={() => handleDeletePortfolio(index)}
                  className="delete-button"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No portfolio items yet.</p>
      )}

      <h3>Portfolio Optimization</h3>
      {userData.optimization && userData.optimization.suggestions.length > 0 ? (
        <div className="optimization">
          <ul>
            {userData.optimization.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
          <p>Target Risk: {userData.optimization.targetRisk} | Target Yield: {userData.optimization.targetYield}%</p>
        </div>
      ) : (
        <p>No optimization suggestions at this time.</p>
      )}

      <h3>Your Wallets</h3>
      {userData.walletAddresses.length > 0 ? (
        <ul>
          {userData.walletAddresses.map((address, index) => (
            <li key={index}>
              {address}{' '}
              {balances[address]?.eth ? `- ${Number(balances[address].eth).toFixed(4)} ETH ($${((Number(balances[address].eth) * 1800)).toFixed(2)})` : ''}
              {balances[address]?.sol ? `- ${Number(balances[address].sol).toFixed(4)} SOL ($${((Number(balances[address].sol) * 50)).toFixed(2)})` : ''}
              {balances[address]?.error ? `- ${balances[address].error}` : ''}
              {balances[address]?.status ? `- ${balances[address].status}` : ''}
              <button
                onClick={() => handleDeleteWallet(index)}
                className="delete-button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No wallet addresses yet.</p>
      )}

      <div className="risk-score">
        <h3>Risk Level: {risk.level} (Score: {risk.score.toFixed(2)})</h3>
      </div>

      <button onClick={handleLogout} className="auth-button logout-button">Logout</button>
    </div>
  );
};

export default Dashboard;
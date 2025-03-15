import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
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
        const provider = new ethers.JsonRpcProvider(rpcResponse.data.rpcUrl);

        const user = userResponse.data;
        const walletBalances = {};
        for (const address of user.walletAddresses) {
          if (ethers.isAddress(address)) {
            const balance = await provider.getBalance(address);
            walletBalances[address] = ethers.formatEther(balance);
          } else {
            walletBalances[address] = 'Invalid Address';
          }
        }
        setUserData(user);
        setBalances(walletBalances);
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
      const response = await api.post('/portfolio', { protocol, percentage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData({ ...userData, portfolio: response.data.portfolio });
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
      const response = await api.delete(`/portfolio/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData({ ...userData, portfolio: response.data.portfolio });
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
      const provider = new ethers.JsonRpcProvider((await api.get('/rpc')).data.rpcUrl);
      if (ethers.isAddress(walletAddress)) {
        const balance = await provider.getBalance(walletAddress);
        setBalances({ ...balances, [walletAddress]: ethers.formatEther(balance) });
      } else {
        setBalances({ ...balances, [walletAddress]: 'Invalid Address' });
      }
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
    if (!userData || !userData.portfolio.length) return 'N/A';
    const totalPercentage = userData.portfolio.reduce((sum, item) => sum + Number(item.percentage), 0);
    return totalPercentage > 100 ? 'High Risk' : totalPercentage > 50 ? 'Moderate Risk' : 'Low Risk';
  };

  if (!userData) return <div>Loading...</div>;

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
          onChange={(e) => setWalletAddress(e.target.value)} // Fixed typo here
          placeholder="Wallet Address (e.g., 0x...)"
          required
          className="auth-input"
        />
        <button type="submit" className="auth-button">Add Wallet</button>
      </form>

      <h3>Your Portfolio</h3>
      {userData.portfolio.length > 0 ? (
        <ul>
          {userData.portfolio.map((item, index) => (
            <li key={index}>
              {item.protocol}: {item.percentage}%
              <button
                onClick={() => handleDeletePortfolio(index)}
                className="delete-button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No portfolio items yet.</p>
      )}

      <h3>Your Wallets</h3>
      {userData.walletAddresses.length > 0 ? (
        <ul>
          {userData.walletAddresses.map((address, index) => (
            <li key={index}>
              {address} {balances[address] ? `- ${balances[address]} ETH` : ''}
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
        <h3>Risk Level: {calculateRiskScore()}</h3>
      </div>

      <button onClick={handleLogout} className="auth-button logout-button">Logout</button>
    </div>
  );
};

export default Dashboard;
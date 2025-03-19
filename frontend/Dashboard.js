
import React, { useEffect, useState } from 'react';
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
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const response = await api.get('/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User Data:', response.data);
        const user = response.data;
        setUserData(user);

        const ethProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS');
        const solRpcs = ['https://solana-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS'];

        const walletBalances = {};
        await Promise.all(user.walletAddresses.map(async (address) => {
          try {
            if (ethers.isAddress(address)) {
              const ethBalance = await ethProvider.getBalance(address);
              walletBalances[address] = { eth: ethers.formatEther(ethBalance) };
            } else if (address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
              const connection = new Connection(solRpcs[0], 'confirmed');
              const publicKey = new PublicKey(address);
              const solBalance = await connection.getBalance(publicKey);
              console.log(`SOL Balance for ${address}: ${solBalance / 1e9}`);
              walletBalances[address] = { sol: solBalance / 1e9 };
            } else {
              walletBalances[address] = { error: 'Unsupported Address' };
            }
          } catch (err) {
            walletBalances[address] = { error: `Fetch Error: ${err.message}` };
          }
        }));
        console.log('Fetched Balances:', walletBalances);
        setBalances(walletBalances);
        setIsLoadingBalances(false);
      } catch (err) {
        console.error('Fetch error:', err);
        localStorage.removeItem('token');
        navigate('/login');
        setIsLoadingBalances(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!userData || !Object.keys(balances).length) return;
    const newAlerts = [];
    userData.portfolio.forEach(item => {
      const proto = userData.protocolData[item.protocol.toLowerCase().trim()];
      if (proto.securityScore < 5) newAlerts.push(`${item.protocol} has low security: ${proto.securityScore}/10`);
      if (proto.tvl < 1e9) newAlerts.push(`${item.protocol} TVL below $1B: $${(proto.tvl / 1e9).toFixed(3)}B`);
    });
    Object.entries(balances).forEach(([address, bal]) => {
      if (bal.eth && Number(bal.eth) > 1) newAlerts.push(`${address} holds high ETH: ${Number(bal.eth).toFixed(4)} ETH`);
      if (bal.sol && Number(bal.sol) > 10) newAlerts.push(`${address} holds high SOL: ${Number(bal.sol).toFixed(4)} SOL`);
    });
    setAlerts(newAlerts);
  }, [userData, balances]);

  const handleAddPortfolioItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/portfolio', { protocol, percentage }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const response = await api.get('/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserData(response.data);
      setProtocol('');
      setPercentage('');
    } catch (err) {
      console.error('Error adding portfolio item:', err);
      alert('Failed to add portfolio item');
    }
  };

  const handleDeletePortfolioItem = async (index) => {
    try {
      await api.delete(`/portfolio/${index}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const response = await api.get('/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserData(response.data);
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      alert('Failed to delete portfolio item');
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wallet', { address: walletAddress }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const response = await api.get('/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserData(response.data);
      const ethProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS');
      const connection = new Connection('https://solana-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS', 'confirmed');
      setIsLoadingBalances(true);
      if (ethers.isAddress(walletAddress)) {
        const ethBalance = await ethProvider.getBalance(walletAddress);
        setBalances((prev) => ({ ...prev, [walletAddress]: { eth: ethers.formatEther(ethBalance) } }));
      } else if (walletAddress.length >= 32 && walletAddress.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)) {
        const publicKey = new PublicKey(walletAddress);
        const solBalance = await connection.getBalance(publicKey);
        setBalances((prev) => ({ ...prev, [walletAddress]: { sol: solBalance / 1e9 } }));
      }
      setWalletAddress('');
      setIsLoadingBalances(false);
    } catch (err) {
      console.error('Error adding wallet:', err);
      alert('Failed to add wallet');
      setIsLoadingBalances(false);
    }
  };

  const handleDeleteWallet = async (index) => {
    try {
      await api.delete(`/wallet/${index}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const response = await api.get('/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserData(response.data);
      setBalances((prev) => {
        const newBalances = { ...prev };
        delete newBalances[userData.walletAddresses[index]];
        return newBalances;
      });
    } catch (err) {
      console.error('Error deleting wallet:', err);
      alert('Failed to delete wallet');
    }
  };

  const calculateRiskLevel = () => {
    if (!userData || !userData.portfolio.length) return { level: 'N/A', score: 0 };
    let totalRisk = userData.portfolio.reduce((sum, item) => {
      const proto = userData?.protocolData[item.protocol.toLowerCase().trim()] || { securityScore: 5 };
      console.log(`${item.protocol}: Security Score = ${proto.securityScore}`);
      return sum + (10 - proto.securityScore) * (item.percentage / 100);
    }, 0);
    
    console.log('Balances:', balances);
    const walletRisk = Object.values(balances).reduce((sum, bal) => {
      const ethRisk = bal.eth && Number(bal.eth) > 0.1 ? 2 : 0;
      const solRisk = bal.sol && Number(bal.sol) > 10 ? 2 : 0;
      console.log(`Balance Check - ETH: ${bal.eth || 0}, SOL: ${bal.sol || 0}, Risk: ${ethRisk + solRisk}`);
      return sum + ethRisk + solRisk;
    }, 0);
    console.log('Wallet Risk:', walletRisk);
    totalRisk += walletRisk;

    return { 
      level: totalRisk > 5 ? 'High Risk' : totalRisk > 2 ? 'Moderate Risk' : 'Low Risk', 
      score: totalRisk.toFixed(2) 
    };
  };

  if (!userData || isLoadingBalances) return <div>Loading...</div>;

  const risk = calculateRiskLevel();

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <p>Welcome, {userData.email}!</p>

      <h3>Add Portfolio Item</h3>
      <form onSubmit={handleAddPortfolioItem} className="portfolio-form">
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
      <ul>
        {userData.portfolio.map((item, index) => {
          const protoKey = item.protocol.toLowerCase().trim();
          const proto = userData.protocolData[protoKey] || {
            securityScore: 5,
            tvl: 0,
            health: 'Unknown',
            apy: 0
          };
          console.log(`Mapping ${item.protocol} -> ${protoKey}:`, proto);
          const tvlInBillions = proto.tvl >= 1e9 ? (proto.tvl / 1e9).toFixed(1) : (proto.tvl / 1e9).toFixed(3);
          return (
            <li key={index}>
              {item.protocol}: {item.percentage}% 
              (Security: {proto.securityScore}/10, TVL: ${tvlInBillions}B, 
              Health: {proto.health}, APY: {proto.apy}%) 
              <button onClick={() => handleDeletePortfolioItem(index)} className="delete-button">Delete</button>
            </li>
          );
        })}
      </ul>

      <h3>Portfolio Optimization</h3>
      <div className="optimization">
        <ul>
          {userData.optimization.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
        <p>Target Risk: {userData.optimization.targetRisk} | Target Yield: {userData.optimization.targetYield}%</p>
      </div>

      <h3>Your Wallets</h3>
      <ul>
        {userData.walletAddresses.map((address, index) => (
          <li key={index}>
            {address} 
            {balances[address]?.eth ? ` - ${Number(balances[address].eth).toFixed(4)} ETH ($${((Number(balances[address].eth) * 1800)).toFixed(2)})` : ''}
            {balances[address]?.sol ? ` - ${Number(balances[address].sol).toFixed(4)} SOL ($${((Number(balances[address].sol) * 50)).toFixed(2)})` : ''}
            {balances[address]?.error ? ` - ${balances[address].error}` : ''}
            {balances[address]?.status ? ` - ${balances[address].status}` : ''}
            <button onClick={() => handleDeleteWallet(index)} className="delete-button">Delete</button>
          </li>
        ))}
      </ul>

      {alerts.length > 0 && (
        <div className="alerts">
          <h3>Alerts</h3>
          <ul>
            {alerts.map((alert, index) => (
              <li key={index} style={{ color: 'red' }}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      <p>Risk Level: {risk.level} (Score: {risk.score})</p>

      <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="auth-button logout-button">Logout</button>
    </div>
  );
};

export default Dashboard;
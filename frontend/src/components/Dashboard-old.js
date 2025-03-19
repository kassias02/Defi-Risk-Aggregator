import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import api from '../services/api';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [protocol, setProtocol] = useState('');
  const [percentage, setPercentage] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Full User Data:', JSON.stringify(response.data, null, 2)); // Detailed log
        const user = response.data;
        setUserData(user);

        const ethProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS');
        const solRpcs = ['https://solana-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS'];

        const walletBalances = {};
        for (const address of user.walletAddresses) {
          walletBalances[address] = { status: 'Fetching...' };
          setBalances((prev) => ({ ...prev, [address]: { status: 'Fetching...' } }));
          try {
            if (ethers.isAddress(address)) {
              const ethBalance = await ethProvider.getBalance(address);
              walletBalances[address] = { eth: ethers.formatEther(ethBalance) };
            } else if (address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
              const connection = new Connection(solRpcs[0], 'confirmed');
              const publicKey = new PublicKey(address);
              const solBalance = await connection.getBalance(publicKey);
              walletBalances[address] = { sol: solBalance / 1e9 };
            } else {
              walletBalances[address] = { error: 'Unsupported Address' };
            }
          } catch (err) {
            walletBalances[address] = { error: `Fetch Error: ${err.message}` };
          }
          setBalances((prev) => ({ ...prev, ...walletBalances }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchData();
  }, []);

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
      setWalletAddress('');
      const ethProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS');
      const solRpcs = ['https://solana-mainnet.g.alchemy.com/v2/cGTUqBrMuqkTR0ZmpVR55i8MCX_eX4kS'];
      if (ethers.isAddress(walletAddress)) {
        const ethBalance = await ethProvider.getBalance(walletAddress);
        setBalances((prev) => ({ ...prev, [walletAddress]: { eth: ethers.formatEther(ethBalance) } }));
      } else if (walletAddress.length >= 32 && walletAddress.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)) {
        const connection = new Connection(solRpcs[0], 'confirmed');
        const publicKey = new PublicKey(walletAddress);
        const solBalance = await connection.getBalance(publicKey);
        setBalances((prev) => ({ ...prev, [walletAddress]: { sol: solBalance / 1e9 } }));
      }
    } catch (err) {
      console.error('Error adding wallet:', err);
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
    }
  };

  const calculateRiskLevel = (portfolio) => {
    const totalRisk = portfolio.reduce((sum, item) => {
      const protoKey = item.protocol.toLowerCase().trim();
      const proto = userData?.protocolData[protoKey] || { securityScore: 5 };
      console.log(`${item.protocol} (trimmed: ${protoKey}): Security Score = ${proto.securityScore}`); // Debug log
      return sum + (10 - proto.securityScore) * (item.percentage / 100);
    }, 0);
    return { 
      level: totalRisk > 5 ? 'High Risk' : totalRisk > 2 ? 'Moderate Risk' : 'Low Risk', 
      score: totalRisk.toFixed(2) 
    };
  };

  if (!userData) return <div>Loading...</div>;

  const risk = calculateRiskLevel(userData.portfolio);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {userData.email}!</p>

      <h2>Add Portfolio Item</h2>
      <form onSubmit={handleAddPortfolioItem}>
        <input
          type="text"
          placeholder="Protocol (e.g., Aave)"
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
        />
        <input
          type="number"
          placeholder="Percentage (0-100)"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          min="0"
          max="100"
        />
        <button type="submit">Add Item</button>
      </form>

      <h2>Add Wallet Address</h2>
      <form onSubmit={handleAddWallet}>
        <input
          type="text"
          placeholder="Wallet Address (e.g., 0x... or Solana)"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <button type="submit">Add Wallet</button>
      </form>

      <h2>Your Portfolio</h2>
      <ul>
        {userData.portfolio.map((item, index) => {
          const protoKey = item.protocol.toLowerCase().trim();
          const proto = userData.protocolData[protoKey] || {
            securityScore: 5,
            tvl: 0,
            health: 'Unknown',
            apy: 0
          };
          console.log(`Rendering ${item.protocol} (trimmed: ${protoKey}):`, proto); // Debug log
          const tvlInBillions = proto.tvl >= 1e9 ? (proto.tvl / 1e9).toFixed(1) : (proto.tvl / 1e9).toFixed(3);
          return (
            <li key={index}>
              {item.protocol}: {item.percentage}% 
              (Security: {proto.securityScore}/10, TVL: ${tvlInBillions}B, 
              Health: {proto.health}, APY: {proto.apy}%) 
              <button onClick={() => handleDeletePortfolioItem(index)}>Delete</button>
            </li>
          );
        })}
      </ul>

      <h2>Portfolio Optimization</h2>
      <ul>
        {userData.optimization.suggestions.map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
      <p>Target Risk: {userData.optimization.targetRisk} | Target Yield: {userData.optimization.targetYield}%</p>

      <h2>Your Wallets</h2>
      <ul>
        {userData.walletAddresses.map((address, index) => (
          <li key={index}>
            {address} 
            {balances[address]?.eth ? ` - ${Number(balances[address].eth).toFixed(4)} ETH ($${((Number(balances[address].eth) * 1800)).toFixed(2)})` : ''}
            {balances[address]?.sol ? ` - ${Number(balances[address].sol).toFixed(4)} SOL ($${((Number(balances[address].sol) * 50)).toFixed(2)})` : ''}
            {balances[address]?.error ? ` - ${balances[address].error}` : ''}
            {balances[address]?.status ? ` - ${balances[address].status}` : ''}
            <button onClick={() => handleDeleteWallet(index)}>Delete</button>
          </li>
        ))}
      </ul>

      <p>Risk Level: {risk.level} (Score: {risk.score})</p>

      <button onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>Logout</button>
    </div>
  );
};

export default Dashboard;
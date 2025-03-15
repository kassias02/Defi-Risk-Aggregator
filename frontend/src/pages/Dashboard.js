// frontend/src/pages/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <h2>Dashboard</h2>
      <p>Welcome to DeFi Risk Aggregator!</p>
      <button onClick={handleLogout} className="auth-button">Logout</button>
    </div>
  );
};

export default Dashboard;
// src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Dashboard = () => {
  return (
    <div className="auth-container">
      <h2>Welcome to DeFi Risk Aggregator</h2>
      <p>Your dashboard is under construction. Check back soon!</p>
      <Link to="/login" className="auth-button">Logout</Link>
    </div>
  );
};

export default Dashboard;
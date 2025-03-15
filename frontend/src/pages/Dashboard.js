import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
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

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <p>Welcome, {userData.email}!</p>
      <h3>Your Portfolio</h3>
      {userData.portfolio.length > 0 ? (
        <ul>
          {userData.portfolio.map((item, index) => (
            <li key={index}>{item.protocol}: {item.percentage}%</li>
          ))}
        </ul>
      ) : (
        <p>No portfolio items yet.</p>
      )}
      <button onClick={handleLogout} className="auth-button">Logout</button>
    </div>
  );
};

export default Dashboard;
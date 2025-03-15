import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [protocol, setProtocol] = useState('');
  const [percentage, setPercentage] = useState('');
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
      console.error('Add portfolio error:', err.response?.data || err.message);
      alert('Failed to add portfolio item: ' + (err.response?.data.msg || 'Unknown error'));
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
      console.error('Delete portfolio error:', err.response?.data || err.message);
      alert('Failed to delete portfolio item: ' + (err.response?.data.msg || 'Unknown error'));
    }
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
      <button onClick={handleLogout} className="auth-button logout-button">Logout</button>
    </div>
  );
};

export default Dashboard;
// frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data.msg || 'Unknown error'));
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="auth-input" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="auth-input" />
        <button type="submit" className="auth-button">Login</button>
      </form>
      <p>Need an account? <Link to="/signup">Sign Up</Link></p>
    </div>
  );
};

export default Login;
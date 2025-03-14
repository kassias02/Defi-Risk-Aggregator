// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client'; // Updated import
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const root = createRoot(document.getElementById('root')); // Create root
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
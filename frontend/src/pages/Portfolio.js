// frontend/src/pages/Portfolio.js
import React, { useState, useEffect } from 'react';
import PortfolioOverview from '../components/PortfolioOverview';
import AlertSettings from '../components/AlertSettings';
import { fetchUserPortfolio, optimizePortfolio } from '../services/api';

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [optimizedPortfolio, setOptimizedPortfolio] = useState(null);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const userPortfolio = await fetchUserPortfolio('user-id-placeholder'); // Remplacer par l'ID réel de l'utilisateur
        setPortfolio(userPortfolio);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    };
    loadPortfolio();
  }, []);

  const handleOptimize = async () => {
    try {
      const optimized = await optimizePortfolio({
        riskProfile: 'medium',
        preferredChains: ['ethereum', 'solana'],
        excludedProtocols: []
      });
      setOptimizedPortfolio(optimized);
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
    }
  };

  return (
    <div className="portfolio-page">
      <h1>Your Portfolio</h1>
      <PortfolioOverview portfolio={portfolio} />
      <button onClick={handleOptimize} className="optimize-button">Optimize Portfolio</button>
      {optimizedPortfolio && (
        <div className="optimized-portfolio">
          <h2>Optimized Portfolio</h2>
          <PortfolioOverview portfolio={optimizedPortfolio.portfolio} />
        </div>
      )}
      <AlertSettings />
    </div>
  );
}

export default Portfolio;
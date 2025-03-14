// frontend/src/pages/Home.js
import React from 'react';

function Home() {
  return (
    <div className="home-page">
      <h1>Welcome to DeFi Risk Aggregator</h1>
      <p>
        Optimize your DeFi investments with advanced risk management and portfolio optimization tools.
      </p>
      <a href="/login" className="cta-button">Get Started</a>
    </div>
  );
}

export default Home;
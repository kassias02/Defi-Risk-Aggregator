// frontend/src/components/PortfolioOverview.js
import React from 'react';
import { formatPercentage } from '../utils/formatters';

function PortfolioOverview({ portfolio }) {
  return (
    <div className="portfolio-overview">
      <h3>Portfolio Allocation</h3>
      <table>
        <thead>
          <tr>
            <th>Protocol</th>
            <th>Allocation</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map((position, index) => (
            <tr key={index}>
              <td>{position.protocol?.name || position.protocolId}</td>
              <td>{formatPercentage(position.allocation)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PortfolioOverview;
// frontend/src/components/ProtocolList.js
import React from 'react';
import { formatPercentage, formatCurrency } from '../utils/formatters';

function ProtocolList({ protocols }) {
  return (
    <div className="protocol-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Chain</th>
            <th>APY</th>
            <th>Risk Score</th>
            <th>TVL</th>
          </tr>
        </thead>
        <tbody>
          {protocols.map((protocol) => (
            <tr key={protocol._id}>
              <td>{protocol.name}</td>
              <td>{protocol.blockchain}</td>
              <td>{formatPercentage(protocol.apy)}</td>
              <td>{protocol.riskScore}/10</td>
              <td>{formatCurrency(protocol.tvl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProtocolList;
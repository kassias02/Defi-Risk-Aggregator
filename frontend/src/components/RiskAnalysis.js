// frontend/src/components/RiskAnalysis.js
import React from 'react';

function RiskAnalysis({ riskData }) {
  if (!riskData) return <p>Loading risk analysis...</p>;

  return (
    <div className="risk-analysis">
      <h3>Risk Overview</h3>
      <p>Total Risk Score: {riskData.totalRiskScore.toFixed(2)}/10</p>
      <p>Risk Level: {riskData.riskLevel}</p>
      <h4>Risk Factors:</h4>
      <ul>
        <li>Protocol Risk: {riskData.riskFactors.protocolRisk.toFixed(2)}</li>
        <li>Chain Diversification: {riskData.riskFactors.chainDiversification.toFixed(2)}</li>
        <li>Concentration Risk: {riskData.riskFactors.concentrationRisk.toFixed(2)}</li>
        <li>Impermanent Loss Risk: {riskData.riskFactors.impermanentLossRisk.toFixed(2)}</li>
        <li>Systemic Risk: {riskData.riskFactors.systemicRisk.toFixed(2)}</li>
      </ul>
    </div>
  );
}

export default RiskAnalysis;
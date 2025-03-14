// frontend/src/utils/formatters.js
export const formatPercentage = (value) => {
  return value ? `${value.toFixed(2)}%` : 'N/A';
};

export const formatCurrency = (value) => {
  return value ? new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value) : 'N/A';
};
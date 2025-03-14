// backend/config/index.js
module.exports = {
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/defi-analyzer', // Fallback to local if env var missing
  jwtSecret: process.env.JWT_SECRET || 'votre-secret-jwt-super-securise',
  rpcEndpoints: {
    ethereum: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key',
    solana: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    avalanche: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    bsc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // Convert string to boolean
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-email-password',
    from: process.env.EMAIL_FROM || '"DeFi Risk Aggregator" <your-email@gmail.com>'
  },
  apiKeys: {
    defiLlama: process.env.DEFI_LLAMA_API_KEY || '',
    coingecko: process.env.COINGECKO_API_KEY || ''
  }
};
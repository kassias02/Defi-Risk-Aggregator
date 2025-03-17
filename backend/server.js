require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', userRoutes);

// Expose RPC URL endpoint
app.get('/api/rpc', (req, res) => {
  res.json({ rpcUrl: process.env.ETH_RPC_URL });
});

// MongoDB connection with increased timeouts
mongoose.connect(process.env.DATABASE_URL, {
  connectTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,  // 45 seconds
  serverSelectionTimeoutMS: 30000 // 30 seconds
})
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
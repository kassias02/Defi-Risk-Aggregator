require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const userController = require('./controllers/userController');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur MongoDB:', err));

app.post('/login', userController.login);
app.post('/register', userController.register);
app.get('/user', authMiddleware, userController.getUser);
app.post('/portfolio', authMiddleware, userController.addPortfolioItem);
app.delete('/portfolio/:index', authMiddleware, userController.deletePortfolioItem);
app.post('/wallet', authMiddleware, userController.addWallet);
app.delete('/wallet/:index', authMiddleware, userController.deleteWallet);

// Add RPC endpoint
app.get('/rpc', (req, res) => {
  res.json({ rpcUrl: process.env.ETH_RPC_URL });
});

app.listen(5000, () => console.log('Serveur démarré sur le port 5000'));
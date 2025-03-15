const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/login', userController.login);
router.post('/register', userController.register);
router.get('/user', auth, userController.getUser);
router.post('/portfolio', auth, userController.addPortfolioItem);
router.delete('/portfolio/:index', auth, userController.deletePortfolioItem);
router.post('/wallet', auth, userController.addWallet);

module.exports = router;
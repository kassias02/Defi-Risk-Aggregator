// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Lowercase for consistency

// Authentication routes
router.post('/register', userController.register);
router.post('/login', userController.login);

module.exports = router; // Single router
// backend/routes/taxRoutes.js
const express = require('express');
const TaxController = require('../controllers/taxController');

const router = express.Router();

router.post('/generate', TaxController.generateTaxReport);

module.exports = router;
const express = require('express');
const router = express.Router();

const netatmoController = require('../controllers/netatmoController');

router.get('/callback', netatmoController.getNetatmoToken)

module.exports = router;
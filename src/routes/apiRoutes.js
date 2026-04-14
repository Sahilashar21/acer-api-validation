const express = require('express');
const { validateAccessKey } = require('../middleware/auth');
const validationController = require('../controllers/validationController');

const router = express.Router();

router.post('/serialnumbervalidation.svc', express.json(), validateAccessKey, validationController.validateSerial);

module.exports = router;

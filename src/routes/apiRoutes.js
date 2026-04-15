const express = require('express');
const { validateAccessKey } = require('../middleware/auth');
const { ipWhitelist } = require('../middleware/ipWhitelist');
const validationController = require('../controllers/validationController');

const router = express.Router();

router.post('/serialnumbervalidation.svc', express.json(), ipWhitelist, validateAccessKey, validationController.validateSerial);

module.exports = router;

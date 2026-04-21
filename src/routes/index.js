const express = require('express');
const adminRoutes = require('./adminRoutes');
const apiRoutes = require('./apiRoutes');

const router = express.Router();

router.use('/', apiRoutes);
router.use('/', adminRoutes);

module.exports = router;

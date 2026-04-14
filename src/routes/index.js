const express = require('express');
const adminRoutes = require('./adminRoutes');
const apiRoutes = require('./apiRoutes');

const router = express.Router();

router.use('/', adminRoutes);
router.use('/', apiRoutes);

module.exports = router;

const asyncHandler = require('../utils/asyncHandler');
const validationService = require('../services/validationService');

const validateSerial = asyncHandler(async (req, res) => {
  const { serialNumber, accessKey } = req.body || {};

  const response = await validationService.validateSerialNumber({
    serialNumber: String(serialNumber || '').trim(),
    accessKey: String(accessKey || '').trim()
  });

  res.json(response);
});

module.exports = {
  validateSerial
};

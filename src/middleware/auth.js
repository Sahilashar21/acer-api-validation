const env = require('../config/env');

function validateAccessKey(req, res, next) {
  const accessKey = req.body.accessKey || req.headers['x-access-key'];

  if (String(accessKey || '') !== env.accessKey) {
    return res.status(401).json({
      responseMessage: 'Invalid Access Key',
      responseStatus: '-2'
    });
  }

  next();
}

module.exports = {
  validateAccessKey
};

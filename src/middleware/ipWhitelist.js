const env = require('../config/env');

function parseWhitelist() {
  const raw = env.bflIpWhitelist || '';
  return raw
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
}

function ipWhitelist(req, res, next) {
  const whitelist = parseWhitelist();
  if (!whitelist.length) {
    return next();
  }

  const ip = req.ip;
  if (whitelist.includes(ip)) {
    return next();
  }

  return res.status(403).json({
    responseMessage: 'Access denied',
    responseStatus: '-9'
  });
}

module.exports = {
  ipWhitelist
};

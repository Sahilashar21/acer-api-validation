const env = require('../config/env');

function parseWhitelist() {
  const raw = env.bflIpWhitelist || '';
  return raw
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
}

function normalizeIp(ip) {
  if (!ip) {
    return '';
  }

  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }

  return ip;
}

function ipToInt(ip) {
  const parts = ip.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }

  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isIpInCidr(ip, cidr) {
  const [base, bitsRaw] = cidr.split('/');
  const bits = Number(bitsRaw);
  if (!base || Number.isNaN(bits) || bits < 0 || bits > 32) {
    return false;
  }

  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  if (ipInt === null || baseInt === null) {
    return false;
  }

  const mask = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1) >>> 0);
  return (ipInt & mask) === (baseInt & mask);
}

function ipWhitelist(req, res, next) {
  const whitelist = parseWhitelist();
  if (!whitelist.length) {
    return next();
  }

  const ip = normalizeIp(req.ip);
  const allowed = whitelist.some((entry) => {
    if (entry.includes('/')) {
      return isIpInCidr(ip, entry);
    }
    return normalizeIp(entry) === ip;
  });

  if (allowed) {
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

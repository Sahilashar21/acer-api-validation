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

  const trimmed = String(ip).trim();
  if (!trimmed) {
    return '';
  }

  const withoutPort = trimmed.includes(':') && trimmed.includes('.')
    ? trimmed.split(':')[0]
    : trimmed;

  if (withoutPort.startsWith('::ffff:')) {
    return withoutPort.replace('::ffff:', '');
  }

  return withoutPort;
}

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    return normalizeIp(cfIp);
  }

  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const forwarded = String(xForwardedFor)
      .split(',')[0]
      .trim();
    return normalizeIp(forwarded);
  }

  return normalizeIp(req.ip);
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

  const ip = getClientIp(req);
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

const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5432', 10),
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'password',
  dbName: process.env.DB_NAME || 'serial_validation',
  accessKey: process.env.ACCESS_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || 'uploads/tmp',
  sessionSecret: process.env.SESSION_SECRET || '',
  sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10),
  lockoutMinutes: parseInt(process.env.LOCKOUT_MINUTES || '60', 10),
  bflIpWhitelist: process.env.BFL_IP_WHITELIST || ''
};

if (!env.accessKey) {
  throw new Error('ACCESS_KEY is required');
}

if (!env.sessionSecret) {
  throw new Error('SESSION_SECRET is required');
}

module.exports = env;

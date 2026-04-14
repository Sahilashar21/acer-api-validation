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
  uploadDir: process.env.UPLOAD_DIR || 'uploads/tmp'
};

if (!env.accessKey) {
  throw new Error('ACCESS_KEY is required');
}

module.exports = env;

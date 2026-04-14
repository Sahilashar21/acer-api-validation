const { Pool } = require('pg');
const env = require('./env');

const pool = env.databaseUrl
  ? new Pool({ connectionString: env.databaseUrl, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false })
  : new Pool({
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
    });

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query
};

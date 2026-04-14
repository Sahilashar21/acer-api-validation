const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

function buildPool() {
  const ssl = process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false;

  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl
    });
  }

  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'serial_validation',
    ssl
  });
}

async function seed() {
  const pool = buildPool();
  const client = await pool.connect();

  try {
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSql);

    await client.query('TRUNCATE TABLE cycles RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE upload_logs RESTART IDENTITY CASCADE');

    const cycles = [];
    const names = ['Alpha 100', 'Beta 200', 'Gamma 300', 'Delta 400', 'Epsilon 500'];

    for (let index = 1; index <= 30; index += 1) {
      const nameIndex = (index - 1) % names.length;
      cycles.push({
        srNo: String(index),
        serial: `SN${String(index).padStart(5, '0')}`,
        name: names[nameIndex],
        validated: false
      });
    }

    const values = [];
    const placeholders = cycles
      .map((cycle, index) => {
        const offset = index * 4;
        values.push(cycle.srNo, cycle.serial, cycle.name, cycle.validated);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      })
      .join(', ');

    await client.query(
      `INSERT INTO cycles (sr_no, serial_number, name, is_validated)
       VALUES ${placeholders}
       ON CONFLICT (serial_number) DO NOTHING`,
      values
    );

    await client.query(
      `INSERT INTO upload_logs (filename, total_rows, inserted, skipped, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['seed.csv', cycles.length, cycles.length, 0]
    );

    const cycleCount = await client.query('SELECT COUNT(*)::int AS count FROM cycles');
    const logCount = await client.query('SELECT COUNT(*)::int AS count FROM upload_logs');

    console.log(`Seed complete. cycles=${cycleCount.rows[0].count}, upload_logs=${logCount.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
});

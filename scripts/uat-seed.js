const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

function buildPool() {
  const ssl = process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false;

  if (process.env.DATABASE_URL) {
    return new Pool({ connectionString: process.env.DATABASE_URL, ssl });
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

async function seedUatSerials() {
  const pool = buildPool();
  const client = await pool.connect();

  const serials = [
    '684000000051',
    '684000000052',
    '684000000053',
    '684000000054',
    '684000000055',
    '684000000056',
    '684000000057',
    '684000000058',
    '684000000059',
    '684000000060',
    '684000000061',
    '684000000062',
    '684000000063',
    '684000000064',
    '684000000065'
  ];

  try {
    await client.query('BEGIN');

    const values = [];
    const placeholders = serials
      .map((serial, index) => {
        const offset = index * 3;
        const srNo = String(index + 1);
        const name = `UAT Model ${String(index + 1).padStart(2, '0')}`;
        values.push(srNo, serial, name);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      })
      .join(', ');

    await client.query(
      `INSERT INTO validation_records (sr_no, serial_number, name)
       VALUES ${placeholders}
       ON CONFLICT (serial_number) DO NOTHING`,
      values
    );

    await client.query(
      `INSERT INTO upload_logs (filename, total_rows, inserted, skipped, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['uat_seed.csv', serials.length, serials.length, 0]
    );

    await client.query('COMMIT');

    const countResult = await client.query('SELECT COUNT(*)::int AS count FROM validation_records');
    console.log(`UAT seed complete. total_cycles=${countResult.rows[0].count}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('UAT seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedUatSerials();

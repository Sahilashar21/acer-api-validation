const db = require('../config/db');

async function getCycleBySerial(serialNumber) {
  const result = await db.query('SELECT * FROM cycles WHERE serial_number = $1 LIMIT 1', [serialNumber]);
  return result.rows[0] || null;
}

async function listCycles({ search = '', status = 'all', limit = 200 } = {}) {
  const filters = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    filters.push(`(serial_number ILIKE $${idx} OR name ILIKE $${idx} OR sr_no ILIKE $${idx})`);
  }

  if (status === 'validated') {
    filters.push('is_validated = TRUE');
  } else if (status === 'pending') {
    filters.push('is_validated = FALSE');
  }

  values.push(limit);
  const limitIdx = values.length;

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT *
     FROM cycles
     ${whereClause}
     ORDER BY updated_at DESC
     LIMIT $${limitIdx}`,
    values
  );

  return result.rows;
}

async function listUploadLogs(limit = 200) {
  const result = await db.query('SELECT * FROM upload_logs ORDER BY uploaded_at DESC LIMIT $1', [limit]);
  return result.rows;
}

async function getDashboardStats() {
  const totalsResult = await db.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE is_validated)::int AS validated,
       COUNT(*) FILTER (WHERE NOT is_validated)::int AS pending
     FROM cycles`
  );

  const uploadResult = await db.query(
    `SELECT filename, total_rows, inserted, skipped, uploaded_at
     FROM upload_logs
     ORDER BY uploaded_at DESC
     LIMIT 1`
  );

  return {
    totals: totalsResult.rows[0] || { total: 0, validated: 0, pending: 0 },
    lastUpload: uploadResult.rows[0] || null
  };
}

async function getValidationTrend(days = 7) {
  const result = await db.query(
    `WITH series AS (
       SELECT date_trunc('day', now()) - ($1::int - 1) * interval '1 day' + (gs * interval '1 day') AS day
       FROM generate_series(0, $1::int - 1) AS gs
     )
     SELECT series.day::date AS day,
            COALESCE(COUNT(c.*), 0)::int AS validated
     FROM series
     LEFT JOIN cycles c
       ON date_trunc('day', c.validated_at) = series.day
     GROUP BY series.day
     ORDER BY series.day`,
    [days]
  );

  return result.rows;
}

async function getUploadTrend(days = 6) {
  const result = await db.query(
    `WITH series AS (
       SELECT date_trunc('day', now()) - ($1::int - 1) * interval '1 day' + (gs * interval '1 day') AS day
       FROM generate_series(0, $1::int - 1) AS gs
     )
     SELECT series.day::date AS day,
            COALESCE(SUM(u.total_rows), 0)::int AS total_rows
     FROM series
     LEFT JOIN upload_logs u
       ON date_trunc('day', u.uploaded_at) = series.day
     GROUP BY series.day
     ORDER BY series.day`,
    [days]
  );

  return result.rows;
}

async function logUpload({ filename, totalRows, inserted, skipped }) {
  await db.query(
    `INSERT INTO upload_logs (filename, total_rows, inserted, skipped, uploaded_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [filename, totalRows, inserted, skipped]
  );
}

async function bulkUpsertCycles(records) {
  if (!records.length) {
    return;
  }

  const batchSize = 250;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const values = [];
    const placeholders = [];

    batch.forEach((record, batchIndex) => {
      const offset = batchIndex * 3;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      values.push(record.srNo || null, record.serialNumber, record.name);
    });

    const sql = `
      INSERT INTO cycles (sr_no, serial_number, name)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (serial_number) DO UPDATE SET
        sr_no = EXCLUDED.sr_no,
        name = EXCLUDED.name,
        updated_at = NOW()
    `;

    await db.query(sql, values);
  }
}

async function markCycleValidated(serialNumber) {
  const result = await db.query(
    `UPDATE cycles
     SET is_validated = TRUE,
         validated_at = NOW(),
         updated_at = NOW()
     WHERE serial_number = $1
     RETURNING *`,
    [serialNumber]
  );

  return result.rows[0] || null;
}

async function updateValidationStatus(id, isValidated) {
  const result = await db.query(
    `UPDATE cycles
     SET is_validated = $2,
         validated_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, isValidated]
  );

  return result.rows[0] || null;
}

async function deleteCyclesByIds(ids) {
  if (!ids.length) {
    return 0;
  }

  const result = await db.query('DELETE FROM cycles WHERE id = ANY($1::bigint[])', [ids]);
  return result.rowCount || 0;
}

async function clearAllData() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM upload_logs');
    await client.query('DELETE FROM cycles');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getCycleBySerial,
  getDashboardStats,
  getValidationTrend,
  getUploadTrend,
  listCycles,
  listUploadLogs,
  logUpload,
  bulkUpsertCycles,
  markCycleValidated,
  updateValidationStatus,
  deleteCyclesByIds,
  clearAllData
};

const db = require('../config/db');
const env = require('../config/env');
const cycleService = require('./cycleService');

async function validateSerialNumber({ serialNumber, accessKey }) {
  if (String(accessKey || '') !== env.accessKey) {
    const error = new Error('Invalid access key');
    error.statusCode = 401;
    error.response = { responseMessage: 'Invalid Access Key', responseStatus: '-2' };
    throw error;
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const serialResult = await client.query('SELECT * FROM cycles WHERE serial_number = $1 FOR UPDATE', [serialNumber]);
    const cycle = serialResult.rows[0];

    if (!cycle) {
      await client.query('ROLLBACK');
      return { responseMessage: 'Invalid Serial Number', responseStatus: '-1' };
    }

    if (cycle.is_validated) {
      await client.query('ROLLBACK');
      return { responseMessage: 'Serial Number Already Validated', responseStatus: '-3' };
    }

    await client.query(
      `UPDATE cycles
       SET is_validated = TRUE,
           validated_at = NOW(),
           updated_at = NOW()
       WHERE serial_number = $1`,
      [serialNumber]
    );

    await client.query('COMMIT');
    return { responseMessage: 'Valid Serial Number', responseStatus: '0' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  validateSerialNumber
};

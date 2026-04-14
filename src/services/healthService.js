const db = require('../config/db');

async function checkHealth() {
  const started = Date.now();

  try {
    await db.query('SELECT 1');
    return {
      ok: true,
      status: 'ok',
      latencyMs: Date.now() - started
    };
  } catch (error) {
    return {
      ok: false,
      status: 'degraded',
      latencyMs: Date.now() - started,
      error: error.message
    };
  }
}

module.exports = {
  checkHealth
};

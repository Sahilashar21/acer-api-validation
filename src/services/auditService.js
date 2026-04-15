const db = require('../config/db');

async function logEvent({
  actorUserId,
  action,
  targetType = null,
  targetId = null,
  success = true,
  ipAddress = null,
  userAgent = null,
  details = null
}) {
  await db.query(
    `INSERT INTO audit_log (actor_user_id, action, target_type, target_id, success, ip_address, user_agent, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [actorUserId, action, targetType, targetId, success, ipAddress, userAgent, details]
  );
}

async function listAuditLogs(limit = 200) {
  const result = await db.query(
    `SELECT audit_log.*, users.username AS actor_username
     FROM audit_log
     LEFT JOIN users ON users.id = audit_log.actor_user_id
     ORDER BY audit_log.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

module.exports = {
  logEvent,
  listAuditLogs
};

const bcrypt = require('bcryptjs');
const db = require('../config/db');

const ROLE_CODES = {
  SYSTEM_ADMIN: 'system_admin',
  OPS_ADMIN: 'ops_admin',
  VIEWER: 'viewer'
};

const ROLE_LABELS = {
  [ROLE_CODES.SYSTEM_ADMIN]: 'System Admin',
  [ROLE_CODES.OPS_ADMIN]: 'Ops Admin',
  [ROLE_CODES.VIEWER]: 'Viewer'
};

async function ensureRoles() {
  const existing = await db.query('SELECT code FROM roles');
  const existingCodes = new Set(existing.rows.map((row) => row.code));
  const inserts = [];
  const values = [];

  Object.entries(ROLE_LABELS).forEach(([code, label]) => {
    if (!existingCodes.has(code)) {
      values.push(code, label);
      const offset = values.length - 1;
      inserts.push(`($${offset}, $${offset + 1})`);
    }
  });

  if (inserts.length) {
    await db.query(`INSERT INTO roles (code, display_name) VALUES ${inserts.join(', ')}`, values);
  }
}

async function getRoleByCode(code) {
  const result = await db.query('SELECT * FROM roles WHERE code = $1', [code]);
  return result.rows[0] || null;
}

async function ensureSystemAdmin({ username, password }) {
  await ensureRoles();
  const role = await getRoleByCode(ROLE_CODES.SYSTEM_ADMIN);
  const existing = await db.query('SELECT id FROM users WHERE role_id = $1', [role.id]);
  if (existing.rows.length) {
    return null;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO users (username, password_hash, role_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [username, passwordHash, role.id]
  );

  return result.rows[0];
}

async function findUserByUsername(username) {
  const result = await db.query(
    `SELECT users.*, roles.code AS role_code, roles.display_name AS role_name
     FROM users
     JOIN roles ON roles.id = users.role_id
     WHERE users.username = $1`,
    [username]
  );

  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await db.query(
    `SELECT users.*, roles.code AS role_code, roles.display_name AS role_name
     FROM users
     JOIN roles ON roles.id = users.role_id
     WHERE users.id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

async function listUsers() {
  const result = await db.query(
    `SELECT users.id, users.username, users.is_active, users.failed_attempts, users.locked_until,
            users.last_login_at, users.created_at, users.updated_at,
            roles.code AS role_code, roles.display_name AS role_name
     FROM users
     JOIN roles ON roles.id = users.role_id
     ORDER BY users.created_at DESC`
  );

  return result.rows;
}

async function createUser({ username, password, roleCode }) {
  const role = await getRoleByCode(roleCode);
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO users (username, password_hash, role_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [username, passwordHash, role.id]
  );

  return result.rows[0];
}

async function updateUserRole({ id, roleCode }) {
  const role = await getRoleByCode(roleCode);
  const result = await db.query(
    `UPDATE users
     SET role_id = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, role.id]
  );

  return result.rows[0] || null;
}

async function updateUsername({ id, username }) {
  const result = await db.query(
    `UPDATE users
     SET username = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, username]
  );

  return result.rows[0] || null;
}

async function setUserActive({ id, isActive }) {
  const result = await db.query(
    `UPDATE users
     SET is_active = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, isActive]
  );

  return result.rows[0] || null;
}

async function resetUserPassword({ id, newPassword }) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const result = await db.query(
    `UPDATE users
     SET password_hash = $2,
         failed_attempts = 0,
         locked_until = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, passwordHash]
  );

  return result.rows[0] || null;
}

async function deleteUser({ id }) {
  const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
  return result.rowCount || 0;
}

async function updatePassword({ id, newPassword }) {
  return resetUserPassword({ id, newPassword });
}

async function incrementFailedAttempts({ id, lockoutUntil }) {
  const result = await db.query(
    `UPDATE users
     SET failed_attempts = failed_attempts + 1,
         locked_until = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING failed_attempts`,
    [id, lockoutUntil]
  );

  return result.rows[0] || null;
}

async function clearFailedAttempts({ id }) {
  await db.query(
    `UPDATE users
     SET failed_attempts = 0,
         locked_until = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}

async function recordLogin({ id }) {
  await db.query(
    `UPDATE users
     SET last_login_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}

module.exports = {
  ROLE_CODES,
  ROLE_LABELS,
  ensureRoles,
  ensureSystemAdmin,
  findUserByUsername,
  findUserById,
  listUsers,
  createUser,
  updateUsername,
  updateUserRole,
  setUserActive,
  resetUserPassword,
  deleteUser,
  updatePassword,
  incrementFailedAttempts,
  clearFailedAttempts,
  recordLogin
};

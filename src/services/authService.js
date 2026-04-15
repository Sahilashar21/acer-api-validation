const bcrypt = require('bcryptjs');
const env = require('../config/env');
const userService = require('./userService');

function isLocked(user) {
  if (!user.locked_until) {
    return false;
  }

  return new Date(user.locked_until) > new Date();
}

async function authenticate({ username, password }) {
  const user = await userService.findUserByUsername(username);
  if (!user || !user.is_active) {
    return { ok: false, reason: 'invalid' };
  }

  if (isLocked(user)) {
    return { ok: false, reason: 'locked', user };
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const failedAttempts = (user.failed_attempts || 0) + 1;
    const lockoutUntil = failedAttempts >= 5
      ? new Date(Date.now() + env.lockoutMinutes * 60 * 1000)
      : user.locked_until;

    await userService.incrementFailedAttempts({ id: user.id, lockoutUntil });
    return { ok: false, reason: 'invalid', user };
  }

  await userService.clearFailedAttempts({ id: user.id });
  await userService.recordLogin({ id: user.id });

  return { ok: true, user };
}

module.exports = {
  authenticate,
  isLocked
};

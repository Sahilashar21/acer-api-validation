const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');
const auditService = require('../services/auditService');

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  const error = req.query.error ? String(req.query.error) : null;

  res.render('users', {
    title: 'User Management',
    users,
    roles: userService.ROLE_LABELS,
    error
  });
});

const createUser = asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();
  const roleCode = String(req.body.roleCode || '').trim();

  if (![userService.ROLE_CODES.OPS_ADMIN, userService.ROLE_CODES.VIEWER].includes(roleCode)) {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/users?error=Invalid%20role%20selection');
    }
    return res.status(400).json({ ok: false, message: 'Invalid role selection.' });
  }

  const existing = await userService.findUserByUsername(username);
  if (existing) {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/users?error=Username%20already%20exists');
    }
    return res.status(400).json({ ok: false, message: 'Username already exists.' });
  }

  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;
  if (!strong.test(password)) {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/users?error=Password%20does%20not%20meet%20complexity%20rules');
    }
    return res.status(400).json({ ok: false, message: 'Password does not meet complexity rules.' });
  }

  const user = await userService.createUser({ username, password, roleCode });
  await auditService.logEvent({
    actorUserId: req.session.userId,
    action: 'user_created',
    targetType: 'user',
    targetId: String(user.id)
  });

  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.redirect('/users');
  }

  return res.json({ ok: true });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  const roleCode = String(req.body.roleCode || '').trim();

  if (!id) {
    return res.status(400).json({ ok: false, message: 'User id is required.' });
  }

  const target = await userService.findUserById(id);
  if (target && target.role_code === userService.ROLE_CODES.SYSTEM_ADMIN) {
    return res.status(400).json({ ok: false, message: 'System Admin role cannot be changed.' });
  }

  const user = await userService.updateUserRole({ id, roleCode });
  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  await auditService.logEvent({
    actorUserId: req.session.userId,
    action: 'role_changed',
    targetType: 'user',
    targetId: String(id)
  });

  return res.json({ ok: true });
});

const updateUsername = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  const username = String(req.body.username || '').trim();

  if (!id || !username) {
    return res.status(400).json({ ok: false, message: 'User id and username are required.' });
  }

  const target = await userService.findUserById(id);
  if (target && target.role_code === userService.ROLE_CODES.SYSTEM_ADMIN) {
    return res.status(400).json({ ok: false, message: 'System Admin username cannot be changed.' });
  }

  const existing = await userService.findUserByUsername(username);
  if (existing && existing.id !== id) {
    return res.status(400).json({ ok: false, message: 'Username already exists.' });
  }

  const updated = await userService.updateUsername({ id, username });
  if (!updated) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  await auditService.logEvent({
    actorUserId: req.session.userId,
    action: 'username_updated',
    targetType: 'user',
    targetId: String(id)
  });

  return res.json({ ok: true });
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  const isActive = String(req.body.isActive) === 'true';

  if (!id) {
    return res.status(400).json({ ok: false, message: 'User id is required.' });
  }

  if (id === req.session.userId) {
    return res.status(400).json({ ok: false, message: 'Cannot deactivate your own account.' });
  }

  const target = await userService.findUserById(id);
  if (target && target.role_code === userService.ROLE_CODES.SYSTEM_ADMIN) {
    return res.status(400).json({ ok: false, message: 'System Admin account cannot be deactivated.' });
  }

  const user = await userService.setUserActive({ id, isActive });
  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  await auditService.logEvent({
    actorUserId: req.session.userId,
    action: isActive ? 'user_activated' : 'user_deactivated',
    targetType: 'user',
    targetId: String(id)
  });

  return res.json({ ok: true });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  const newPassword = String(req.body.newPassword || '').trim();

  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;
  if (!strong.test(newPassword)) {
    return res.status(400).json({ ok: false, message: 'Password does not meet complexity rules.' });
  }

  const user = await userService.resetUserPassword({ id, newPassword });
  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  await auditService.logEvent({
    actorUserId: req.session.userId,
    action: 'password_reset',
    targetType: 'user',
    targetId: String(id)
  });

  return res.json({ ok: true });
});

const deleteUser = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'User id is required.' });
  }

  const target = await userService.findUserById(id);
  if (!target) {
    return res.status(404).json({ ok: false, message: 'User not found.' });
  }

  if (target.role_code === userService.ROLE_CODES.SYSTEM_ADMIN) {
    return res.status(400).json({ ok: false, message: 'System Admin cannot be deleted.' });
  }

  const deleted = await userService.deleteUser({ id });
  if (deleted) {
    await auditService.logEvent({
      actorUserId: req.session.userId,
      action: 'user_deleted',
      targetType: 'user',
      targetId: String(id)
    });
  }

  return res.json({ ok: true, deleted });
});

const unlockUser = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'User id is required.' });
  }

  await userService.clearFailedAttempts({ id });
  await auditService.logEvent({
    actorUserId: req.session.userId,
    action: 'account_unlocked',
    targetType: 'user',
    targetId: String(id)
  });

  return res.json({ ok: true });
});

module.exports = {
  listUsers,
  createUser,
  updateUsername,
  updateUserRole,
  toggleUserActive,
  resetUserPassword,
  unlockUser,
  deleteUser
};

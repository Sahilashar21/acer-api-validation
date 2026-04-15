const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const auditService = require('../services/auditService');
const userService = require('../services/userService');

const renderLogin = (req, res, { modalMode = false, error = null } = {}) => {
  res.render('login', {
    title: 'Login',
    error,
    modalMode,
    forgotText: 'Contact your System Admin to reset your password.'
  });
};

const showLogin = asyncHandler(async (req, res) => {
  const error = req.query.error
    ? 'Your session has expired. Please sign in again.'
    : null;
  return renderLogin(req, res, { modalMode: false, error });
});


const login = asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();

  const result = await authService.authenticate({ username, password });
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'] || null;

  if (!result.ok) {
    await auditService.logEvent({
      actorUserId: result.user ? result.user.id : null,
      action: 'login_failed',
      targetType: 'user',
      targetId: username,
      success: false,
      ipAddress,
      userAgent
    });

    const errorMessage = result.reason === 'locked'
      ? 'Account locked. Contact your System Admin.'
      : 'Invalid credentials.';

    return renderLogin(req, res, { modalMode: false, error: errorMessage });
  }

  req.session.userId = result.user.id;
  req.session.roleCode = result.user.role_code;

  await auditService.logEvent({
    actorUserId: result.user.id,
    action: 'login_success',
    targetType: 'user',
    targetId: String(result.user.id),
    success: true,
    ipAddress,
    userAgent
  });

  return res.redirect('/');
});

const logout = asyncHandler(async (req, res) => {
  const userId = req.session.userId;
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    if (userId) {
      auditService.logEvent({
        actorUserId: userId,
        action: 'logout',
        targetType: 'user',
        targetId: String(userId)
      }).catch(() => {});
    }
    res.redirect('/login');
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.session.userId);
  const currentPassword = String(req.body.currentPassword || '').trim();
  const newPassword = String(req.body.newPassword || '').trim();
  const confirmPassword = String(req.body.confirmPassword || '').trim();

  if (!user) {
    return res.status(400).json({ ok: false, message: 'User not found.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ ok: false, message: 'Passwords do not match.' });
  }

  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;
  if (!strong.test(newPassword)) {
    return res.status(400).json({ ok: false, message: 'Password does not meet complexity rules.' });
  }

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    return res.status(400).json({ ok: false, message: 'Invalid credentials.' });
  }

  await userService.updatePassword({ id: user.id, newPassword });
  await auditService.logEvent({
    actorUserId: user.id,
    action: 'password_changed',
    targetType: 'user',
    targetId: String(user.id)
  });

  return res.json({ ok: true });
});

module.exports = {
  showLogin,
  login,
  logout,
  changePassword
};

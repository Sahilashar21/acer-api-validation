const userService = require('../services/userService');

async function attachUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    res.locals.user = null;
    return next();
  }

  const user = await userService.findUserById(req.session.userId);
  if (!user || !user.is_active) {
    req.session.destroy(() => {});
    res.locals.user = null;
    return next();
  }

  res.locals.user = {
    id: user.id,
    username: user.username,
    roleCode: user.role_code,
    roleName: user.role_name
  };

  return next();
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId || !res.locals.user) {
    if (req.session) {
      req.session.destroy(() => {});
    }
    return res.redirect('/login');
  }

  return next();
}

function requireRole(allowedRoles) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const user = res.locals.user;
    if (!user || !allowed.includes(user.roleCode)) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'You do not have permission to access this resource.'
      });
    }

    return next();
  };
}

module.exports = {
  attachUser,
  requireAuth,
  requireRole
};

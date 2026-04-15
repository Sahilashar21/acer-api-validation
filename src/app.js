const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const csrf = require('csurf');
const routes = require('./routes');
const healthService = require('./services/healthService');
const env = require('./config/env');
const db = require('./config/db');
const { attachUser } = require('./middleware/authSession');
const userService = require('./services/userService');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(helmet());
  app.use(morgan('combined'));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 300 }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      store: new PgSession({ pool: db.pool, tableName: 'session' }),
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.nodeEnv === 'production',
        maxAge: env.sessionTimeoutMinutes * 60 * 1000
      }
    })
  );
  app.use(attachUser);
  app.use(express.static(path.join(__dirname, 'public')));

  const csrfProtection = csrf();
  app.use((req, res, next) => {
    if (
      req.path.startsWith('/serialnumbervalidation.svc') ||
      req.path.startsWith('/api/health') ||
      req.path.startsWith('/login') ||
      req.path.startsWith('/logout') ||
      req.path.startsWith('/upload/preview') ||
      req.path.startsWith('/upload/import')
    ) {
      return next();
    }
    return csrfProtection(req, res, next);
  });

  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
    return next();
  });

  app.get('/api/health', async (req, res) => {
    const health = await healthService.checkHealth();
    res.status(health.ok ? 200 : 503).json(health);
  });

  userService.ensureSystemAdmin({ username: 'ebg_acer_SAdmin', password: '12345678' }).catch((error) => {
    console.error('Failed to ensure system admin:', error.message);
  });

  app.use('/', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

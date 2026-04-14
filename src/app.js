const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const healthService = require('./services/healthService');
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
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', async (req, res) => {
    const health = await healthService.checkHealth();
    res.status(health.ok ? 200 : 503).json(health);
  });

  app.use('/', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

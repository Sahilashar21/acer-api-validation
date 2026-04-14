function notFound(req, res, next) {
  res.status(404).format({
    json: () => res.json({ message: 'Not Found' }),
    html: () => res.status(404).send('<h1>404 Not Found</h1>'),
    default: () => res.status(404).send('Not Found')
  });
}

function errorHandler(error, req, res, next) {
  // Log full error for troubleshooting in development/production logs.
  console.error(error);
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (res.headersSent) {
    return next(error);
  }

  if (req.originalUrl.startsWith('/serialnumbervalidation.svc')) {
    const response = error.response || {
      responseMessage: message,
      responseStatus: '-9'
    };

    return res.status(statusCode).json(response);
  }

  return res.status(statusCode).render('error', {
    title: 'Error',
    message
  });
}

module.exports = {
  notFound,
  errorHandler
};

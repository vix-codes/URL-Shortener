// Centralized error handler so unexpected failures do not leak stack traces in production.
// For AWS App Runner, logs go to CloudWatch while clients get a clean JSON response.
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    error: 'Internal server error',
  });
}

module.exports = errorHandler;


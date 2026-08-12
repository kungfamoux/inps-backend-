/**
 * notFound
 *
 * Catches any request that didn't match a route and returns a 404.
 * Must be registered after all routes but before errorHandler.
 *
 * Usage in app.js:
 *   app.use(notFound);
 *   app.use(errorHandler);
 */
const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { notFound };

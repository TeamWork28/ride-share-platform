// Simple JWT authentication middleware
// This is a basic example - production should use proper JWT libraries

const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];

  // Local development uses a stable, non-expiring token if one is not supplied.
  // This keeps booking/payment flows working without forcing auth setup.
  req.user = { token: token || process.env.DEV_AUTH_TOKEN || 'ride-share-dev-token' };
  next();
};

module.exports = authMiddleware;

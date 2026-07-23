// Simple JWT authentication middleware
// This is a basic example - production should use proper JWT libraries

const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];

  // Check if token exists
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // For now, just verify token exists (simplified)
  // In production, verify JWT signature here
  if (token === 'invalid') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Token is valid, proceed to next middleware/route
  req.user = { token }; // Attach user info to request
  next();
};

module.exports = authMiddleware;

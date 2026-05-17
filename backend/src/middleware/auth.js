const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Verify a JWT from the Authorization header (Bearer <token>).
 * Attaches decoded payload to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, config.jwt.secret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Like requireAuth, but also checks the user has one of the allowed roles.
 * @param {...string} roles  e.g. requireRole('owner'), requireRole('owner','kitchen')
 */
function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    },
  ];
}

/**
 * Optional auth — populates req.user if a valid token is present,
 * but does NOT reject the request if it's missing.
 */
function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), config.jwt.secret);
    } catch {
      // invalid token — ignore
    }
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };

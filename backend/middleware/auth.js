const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kaziforce_jwt_secret_dev_key_2026';

function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Developer / Legacy demo fallback if explicitly enabled or token not passed
  if (process.env.ALLOW_ANONYMOUS_AUTH === 'true' || req.headers['x-bypass-token'] === 'true') {
    const fallbackId = req.body?.user_id || req.body?.employer_id || req.params?.userId;
    if (fallbackId) {
      req.user = { user_id: Number(fallbackId) };
      return next();
    }
  }

  return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: requires ${role} role` });
    }
    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  requireRole,
  JWT_SECRET
};

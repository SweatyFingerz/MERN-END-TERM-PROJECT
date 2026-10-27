const jwt = require('jsonwebtoken');

// Forward async errors to the Express error handler
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const parse = (req) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET).id; } catch { return null; }
};

const auth = (req, res, next) => {
  const id = parse(req);
  if (!id) return res.status(401).json({ message: 'Please log in to continue' });
  req.userId = id;
  next();
};

const optionalAuth = (req, _res, next) => { req.userId = parse(req); next(); };

module.exports = { wrap, auth, optionalAuth };

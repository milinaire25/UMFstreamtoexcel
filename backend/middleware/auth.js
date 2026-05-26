'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';

function verifyToken(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Synchronous verify used by WebSocket handler
verifyToken.sync = (token) => {
  try { return jwt.verify(token, SECRET); } catch { return null; }
};

verifyToken.sign = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: '12h' });

module.exports = { verifyToken };

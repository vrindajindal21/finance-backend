// src/middleware/auth.js - JWT Auth + RBAC middleware
const jwt = require('jsonwebtoken');
const { error } = require('../utils');

const JWT_SECRET = process.env.JWT_SECRET || 'finance-portal-secret-2026';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return error(res, 'Unauthorized', 401);
  if (!roles.includes(req.user.role)) {
    return error(res, `Access denied. Required role: ${roles.join(' or ')}`, 403);
  }
  next();
};

module.exports = { authenticate, authorize, JWT_SECRET };

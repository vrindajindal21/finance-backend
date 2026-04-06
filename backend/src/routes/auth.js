// src/routes/auth.js - Authentication routes
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { uuid, success, error } = require('../utils');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return error(res, 'Email already registered', 409);

    const hashed = await bcrypt.hash(password, 10);
    const id = uuid();

    db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, email, hashed, name, role);

    const user = db.prepare('SELECT id, email, name, role, status, created_at FROM users WHERE id = ?').get(id);
    return success(res, { message: 'User registered successfully', user }, 201);
  } catch (err) {
    return error(res, 'Registration failed', 500);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return error(res, 'Invalid email or password', 401);
    if (user.status === 'INACTIVE') return error(res, 'Account is inactive. Contact an admin.', 403);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return error(res, 'Invalid email or password', 401);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return success(res, {
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    return error(res, 'Login failed', 500);
  }
});

// GET /api/auth/me
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return error(res, 'User not found', 404);
  return success(res, { user });
});

module.exports = router;

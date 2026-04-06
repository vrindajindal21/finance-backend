// src/routes/admin.js - Admin-only user management routes
const router = require('express').Router();
const db = require('../db');
const { success, error } = require('../utils');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { userUpdateSchema } = require('../schemas');

// All routes require Admin role
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/users - List all users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, email, name, role, status, created_at FROM users ORDER BY created_at DESC
  `).all();
  return success(res, { users, total: users.length });
});

// GET /api/admin/users/:id - Get single user
router.get('/users/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, email, name, role, status, created_at FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return error(res, 'User not found', 404);
  return success(res, { user });
});

// PUT /api/admin/users/:id - Update user role or status
router.put('/users/:id', validate(userUpdateSchema), (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return error(res, 'User not found', 404);

  if (id === req.user.id && status === 'INACTIVE') {
    return error(res, 'You cannot deactivate your own account', 400);
  }

  const updates = [];
  const params = [];
  if (role) { updates.push('role = ?'); params.push(role); }
  if (status) { updates.push('status = ?'); params.push(status); }

  if (!updates.length) return error(res, 'No fields to update', 400);

  updates.push('updated_at = ?');
  params.push(new Date().toISOString(), id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const user = db.prepare('SELECT id, email, name, role, status FROM users WHERE id = ?').get(id);
  return success(res, { message: 'User updated', user });
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return error(res, 'You cannot delete your own account', 400);

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return error(res, 'User not found', 404);

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return success(res, { message: 'User deleted' });
});

module.exports = router;

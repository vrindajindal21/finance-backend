// src/routes/records.js - Financial records routes
const router = require('express').Router();
const db = require('../db');
const { uuid, success, error } = require('../utils');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { recordSchema, recordUpdateSchema, recordQuerySchema } = require('../schemas');

// GET /api/records/summary - All authenticated users can see summary
router.get('/summary', authenticate, (req, res) => {
  try {
    const allRecords = db.prepare(`
      SELECT amount, type, category, date FROM financial_records WHERE is_deleted = 0
    `).all();

    const totalIncome = allRecords.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = allRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + r.amount, 0);

    // Category-wise totals
    const categoryWise = {};
    allRecords.forEach(r => {
      categoryWise[r.category] = (categoryWise[r.category] || 0) + r.amount;
    });

    // Monthly trends (last 6 months)
    const monthly = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total
      FROM financial_records
      WHERE is_deleted = 0 AND date >= date('now', '-6 months')
      GROUP BY month, type
      ORDER BY month DESC
    `).all();

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT id, amount, type, category, date, notes, created_at
      FROM financial_records WHERE is_deleted = 0
      ORDER BY created_at DESC LIMIT 5
    `).all();

    return success(res, {
      totalIncome: +totalIncome.toFixed(2),
      totalExpenses: +totalExpenses.toFixed(2),
      netBalance: +(totalIncome - totalExpenses).toFixed(2),
      categoryWiseTotals: categoryWise,
      monthlyTrends: monthly,
      recentActivity,
    });
  } catch (err) {
    return error(res, 'Failed to fetch summary', 500);
  }
});

// GET /api/records - Analyst and Admin can view records with filtering + pagination
router.get('/', authenticate, authorize('ANALYST', 'ADMIN'), validate(recordQuerySchema, 'query'), (req, res) => {
  const { type, category, start_date, end_date, q, page, limit } = req.query;

  try {
    let where = ['is_deleted = 0'];
    const params = [];

    if (type) { where.push('type = ?'); params.push(type); }
    if (category) { where.push('category LIKE ?'); params.push(`%${category}%`); }
    if (start_date) { where.push('date >= ?'); params.push(start_date); }
    if (end_date) { where.push('date <= ?'); params.push(end_date); }
    if (q) { where.push('(category LIKE ? OR notes LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

    const whereClause = 'WHERE ' + where.join(' AND ');
    const offset = (page - 1) * limit;

    const total = db.prepare(`SELECT COUNT(*) as count FROM financial_records ${whereClause}`).get(...params).count;
    const records = db.prepare(`
      SELECT id, amount, type, category, date, notes, created_at, updated_at
      FROM financial_records ${whereClause}
      ORDER BY date DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return success(res, {
      records,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return error(res, 'Failed to fetch records', 500);
  }
});

// POST /api/records - Admin only
router.post('/', authenticate, authorize('ADMIN'), validate(recordSchema), (req, res) => {
  const { amount, type, category, date, notes } = req.body;
  const id = uuid();
  const recordDate = date || new Date().toISOString().split('T')[0];

  try {
    db.prepare(`
      INSERT INTO financial_records (id, amount, type, category, date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, amount, type, category, recordDate, notes || null);

    const record = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);
    return success(res, record, 201);
  } catch (err) {
    return error(res, 'Failed to create record', 500);
  }
});

// PUT /api/records/:id - Admin only
router.put('/:id', authenticate, authorize('ADMIN'), validate(recordUpdateSchema), (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
    if (!existing) return error(res, 'Record not found', 404);

    const updated = { ...existing, ...req.body, updated_at: new Date().toISOString() };
    db.prepare(`
      UPDATE financial_records
      SET amount = ?, type = ?, category = ?, date = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(updated.amount, updated.type, updated.category, updated.date, updated.notes, updated.updated_at, id);

    return success(res, db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id));
  } catch (err) {
    return error(res, 'Failed to update record', 500);
  }
});

// DELETE /api/records/:id - Admin only (soft delete)
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT id FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
    if (!existing) return error(res, 'Record not found', 404);

    db.prepare(`UPDATE financial_records SET is_deleted = 1, updated_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), id);

    return success(res, { message: 'Record deleted successfully' });
  } catch (err) {
    return error(res, 'Failed to delete record', 500);
  }
});

// POST /api/records/:id/restore - Admin only
router.post('/:id/restore', authenticate, authorize('ADMIN'), (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT id FROM financial_records WHERE id = ? AND is_deleted = 1').get(id);
    if (!existing) return error(res, 'Deleted record not found', 404);

    db.prepare(`UPDATE financial_records SET is_deleted = 0, updated_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), id);

    return success(res, { message: 'Record restored successfully' });
  } catch (err) {
    return error(res, 'Failed to restore record', 500);
  }
});

module.exports = router;

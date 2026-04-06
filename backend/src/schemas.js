// src/schemas.js - Zod validation schemas
const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional().default('VIEWER'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const recordSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE'], { errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }) }),
  category: z.string().min(1, 'Category is required'),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const recordUpdateSchema = recordSchema.partial();

const recordQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

const userUpdateSchema = z.object({
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  recordSchema,
  recordUpdateSchema,
  recordQuerySchema,
  userUpdateSchema,
};

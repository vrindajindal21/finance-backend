// src/middleware/validate.js - Zod validation middleware
const { z } = require('zod');
const { error } = require('../utils');

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return error(res, 'Validation failed', 400, errors);
  }
  req[source] = result.data;
  next();
};

module.exports = { validate };

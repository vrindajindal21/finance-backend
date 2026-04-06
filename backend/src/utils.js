// src/utils.js - Shared utilities
const { randomUUID } = require('crypto');

const uuid = () => randomUUID();

const success = (res, data, status = 200) => res.status(status).json(data);

const error = (res, message, status = 400, details = null) => {
  const body = { message };
  if (details) body.errors = details;
  return res.status(status).json(body);
};

module.exports = { uuid, success, error };

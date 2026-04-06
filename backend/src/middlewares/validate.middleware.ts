import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      return res.status(400).json({
        message: 'Validation error',
        errors: err.errors.map((e: any) => ({ path: e.path, message: e.message }))
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (err: any) {
      return res.status(400).json({
        message: 'Query validation error',
        errors: err.errors.map((e: any) => ({ path: e.path, message: e.message }))
      });
    }
  };
};

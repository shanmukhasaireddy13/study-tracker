import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.params) req.params = schema.params.parse(req.params);
    if (schema.query) req.query = schema.query.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', details: err.errors });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
};



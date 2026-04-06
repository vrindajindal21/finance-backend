import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validations/auth.schema';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

export default router;

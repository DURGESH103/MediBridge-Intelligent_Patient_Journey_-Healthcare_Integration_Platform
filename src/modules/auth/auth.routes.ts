import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { loginSchema, refreshSchema, registerSchema } from './auth.validation';
import { env } from '../../config/env';

const router = Router();

// Login is a common brute-force target; keep it tighter than the global API rate limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.loginMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later', errors: [] },
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.get('/me', authenticate, authController.me);

export default router;

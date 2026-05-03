import { Router } from 'express';
import { authController } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, authController.updateProfile);

export default router;

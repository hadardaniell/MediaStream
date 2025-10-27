import {Router} from 'express';
import {login, logout, register, me} from '../controllers/authController.js';
import {requireAuth} from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
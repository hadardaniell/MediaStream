import { Router } from 'express';
import {
    listUsers, getUser, createUser, updateUser, deleteUser
} from '../controllers/usersController.js';
import { requireAuth, requireAdmin, requireSelfOrAdmin } from '../middlewares/authMiddleware.js';

console.log('users router loaded');

const router = Router();

router.get('/', requireAuth, requireAdmin, listUsers);
router.post('/', requireAuth, requireAdmin, createUser);

router.get('/:id', requireAuth, requireSelfOrAdmin('id'), getUser);
router.patch('/:id', requireAuth, requireSelfOrAdmin('id'), updateUser);
router.delete('/:id', requireAuth, requireAdmin, deleteUser);
router.get('/_ping', (_req, res) => res.json({ ok: true }));

export default router;
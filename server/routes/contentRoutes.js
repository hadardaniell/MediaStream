import express from 'express';
import { ContentController } from '../controllers/contentController.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';
import { ensureJson } from '../middlewares/ensureJsonMiddleware.js';
const router = express.Router();

router.use(requireAuth);

//User Actions
router.get('/profile/:profileId', ContentController.getByProfile);
router.get('/', ContentController.getAll);
router.get('/popular', ContentController.getPopular);
router.get('/:id', ContentController.getById);

//Admin Actions
router.post('/',requireAdmin, ensureJson,  ContentController.create);
router.patch('/:id',requireAdmin, ensureJson, ContentController.update);
router.delete('/:id',requireAdmin, ContentController.remove);
export default router;

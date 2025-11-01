import express from 'express';
import { LikesController } from '../controllers/likesController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { ensureJson } from '../middlewares/ensureJsonMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// GET Requests
router.get('/', LikesController.getAll);
router.get('/content/:contentId', LikesController.getByContent);
router.get('/profile/:profileId', LikesController.getByProfile);
router.get('/content/:contentId/count', LikesController.countByContent);
router.get('/profile/:profileId/count', LikesController.countByProfile);

// POST Requests
router.post('/', ensureJson, LikesController.create);

// DELETE by id (optional) and idempotent pair delete
router.delete('/', ensureJson, LikesController.removeByPair);
router.delete('/:id', LikesController.removeById);
router.delete('/profile/:profileId/all', LikesController.removeAllByProfile);

export default router;

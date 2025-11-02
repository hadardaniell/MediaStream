// routes/watches.js
import express from 'express';
import { WatchesController } from '../controllers/watchesController.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';
import { ensureJson } from '../middlewares/ensureJsonMiddleware.js';

const router = express.Router();

// Auth for all watches routes
router.use(requireAuth);

// WRITE first (to avoid being caught by :profileId)
router.post('/progress', ensureJson, WatchesController.upsertProgress);
router.post('/complete', ensureJson, WatchesController.markCompleted);

// ADMIN list-all (paginated & filterable)
router.get('/', requireAdmin, WatchesController.listAll);

// READ specifics
router.get('/:profileId/:contentId', WatchesController.getOne);
router.get('/:profileId', WatchesController.getByProfile);

// OPTIONAL reset to "not watched"
router.delete('/:profileId/:contentId', WatchesController.remove);

export default router;

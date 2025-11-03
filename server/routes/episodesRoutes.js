import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';
import * as ctrl from '../controllers/episodesController.js';

const r = Router();
//public (User)
r.get('/content/:contentId/episodes', ctrl.list);

//protected (Admin)
r.post('/content/:contentId/episodes', requireAuth, requireAdmin, ctrl.create);
r.post('/content/:contentId/episodes/bulk', requireAuth, requireAdmin, ctrl.bulkCreate);
r.patch('/episodes/:id', requireAuth, requireAdmin, ctrl.update);
r.delete('/episodes/:id', requireAuth, requireAdmin, ctrl.remove);

export default r;

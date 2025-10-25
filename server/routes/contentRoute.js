import express from 'express';
import { ContentController } from '../controllers/contentController.js';
const router = express.Router();

//Ensure JSON Function
function ensureJson(req, res, next) {
  // Only enforce for methods that should have a JSON body
  if (req.method === 'POST' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
  }
  next();
}

//HTTP Request Types
router.get('/', ContentController.getAll);
router.get('/:id', ContentController.getById);
router.post('/', ensureJson,  ContentController.create);
router.patch('/:id', ensureJson, ContentController.update);
router.delete('/:id', ContentController.remove);
export default router;

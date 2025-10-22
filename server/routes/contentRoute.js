import express from 'express';
import { ContentController } from '../controllers/contentController.js';
const router = express.Router();
router.get('/', ContentController.getAll);
router.get('/:id', ContentController.getById);
export default router;

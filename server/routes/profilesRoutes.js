// routes/profilesRoutes.js
import express from 'express';
import {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile
} from '../controllers/profilesController.js';
import { attachUser } from '../middlewares/sessionMiddleware.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

//
router.use(attachUser); 
//
router.use(requireAuth);

router.get('/', listProfiles);
router.get('/:id', getProfile);
router.post('/', createProfile);
router.patch('/:id', updateProfile);
router.delete('/:id', deleteProfile);

export default router;

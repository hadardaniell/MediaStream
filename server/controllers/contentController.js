// controllers/contentController.js
import { ContentModel } from '../models/contentModel.js';

export const ContentController = {
  // ✅ GET /api/content
  async getAll(req, res) {
    try {
      const filter = {};
      const sort = {};

      // --- Optional filtering from query parameters ---
      if (req.query.type) filter.type = req.query.type; // e.g. ?type=movie
      if (req.query.genre) filter.genres = req.query.genre; // e.g. ?genre=Comedy
      if (req.query.year) filter.year = parseInt(req.query.year); // e.g. ?year=2020

      // --- Optional sorting ---
      if (req.query.sortBy === 'rating') sort.rating = -1; // highest rating first
      if (req.query.sortBy === 'year') sort.year = -1;     // newest first
      if (req.query.sortBy === 'likes') sort.likes = -1;   // most liked first

      const content = await ContentModel.getAll(filter, sort);
      res.json(content);
    } catch (err) {
      console.error('❌ Error fetching content:', err);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  },

  // ✅ GET /api/content/:id
  async getById(req, res) {
    try {
      const item = await ContentModel.getById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Content not found' });
      res.json(item);
    } catch (err) {
      console.error('❌ Error fetching content by ID:', err);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  },
};

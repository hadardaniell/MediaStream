// controllers/watchesController.js
import { WatchesModel } from '../models/watchesModel.js';
import { ContentModel } from '../models/contentModel.js'; // used to check type 'series'

const asIntOrUndefined = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isInteger(n) ? n : undefined;
};

export const WatchesController = {
  // ADMIN: GET /api/watches?status=...&limit=50&cursor=...&profileId=...&contentId=...
  async listAll(req, res) {
    try {
      const { status, profileId, contentId, limit = 50, cursor } = req.query;
      const result = await WatchesModel.listAll({ status, profileId, contentId, limit, cursor });
      res.json(result);
    } catch (err) {
      console.error('listAll error:', err);
      res.status(500).json({ error: 'Failed to list watches' });
    }
  },

  // GET /api/watches/:profileId  (+ optional ?status=...&include=content)
  async getByProfile(req, res) {
    try {
      const { profileId } = req.params;
      const { status, include } = req.query;

      if (!profileId) return res.status(400).json({ error: 'profileId is required' });

      const data = include === 'content'
        ? await WatchesModel.getByProfileWithContent(profileId, { status })
        : await WatchesModel.getByProfile(profileId, { status });

      res.json(data);
    } catch (err) {
      console.error('getByProfile error:', err);
      res.status(500).json({ error: 'Failed to fetch watches' });
    }
  },

  // GET /api/watches/:profileId/:contentId
  async getOne(req, res) {
    try {
      const { profileId, contentId } = req.params;
      const doc = await WatchesModel.getOne(profileId, contentId);
      if (!doc) return res.status(404).json({ error: 'Not found (treat as not_watched_yet)' });
      res.json(doc);
    } catch (err) {
      console.error('getOne error:', err);
      res.status(500).json({ error: 'Failed to fetch watch' });
    }
  },

  // POST /api/watches/progress
  // body: { profileId, contentId, progressSeconds, seasonNumber?, episodeNumber? }
  async upsertProgress(req, res) {
    try {
      const { profileId, contentId } = req.body;
      const progressSeconds = asIntOrUndefined(req.body.progressSeconds);
      const seasonNumber    = asIntOrUndefined(req.body.seasonNumber);
      const episodeNumber   = asIntOrUndefined(req.body.episodeNumber);

      if (!profileId || !contentId) {
        return res.status(400).json({ error: 'profileId and contentId are required' });
      }
      if (progressSeconds == null || progressSeconds < 0) {
        return res.status(400).json({ error: 'progressSeconds (int ≥ 0) is required' });
      }

      // Enforce series-only season/episode
      const content = await ContentModel.getById(contentId);
      if (!content) return res.status(404).json({ error: 'Content not found' });

      if (content.type === 'series') {
        if (seasonNumber == null || episodeNumber == null) {
          return res.status(400).json({ error: 'seasonNumber and episodeNumber are required for series' });
        }
      } else {
        if (seasonNumber != null || episodeNumber != null) {
          return res.status(400).json({ error: 'seasonNumber/episodeNumber allowed only for series' });
        }
      }

      await WatchesModel.upsertProgress({ profileId, contentId, progressSeconds, seasonNumber, episodeNumber });
      res.status(204).end();
    } catch (err) {
      console.error('upsertProgress error:', err);
      if (err?.code === 11000) return res.status(409).json({ error: 'Duplicate (profileId, contentId)' });
      res.status(500).json({ error: 'Failed to upsert progress' });
    }
  },

  // POST /api/watches/complete
  // body: { profileId, contentId }
  async markCompleted(req, res) {
    try {
      const { profileId, contentId } = req.body;
      if (!profileId || !contentId) {
        return res.status(400).json({ error: 'profileId and contentId are required' });
      }
      const content = await ContentModel.getById(contentId);
      if (!content) return res.status(404).json({ error: 'Content not found' });

      await WatchesModel.markCompleted({ profileId, contentId });
      res.status(204).end();
    } catch (err) {
      console.error('markCompleted error:', err);
      res.status(500).json({ error: 'Failed to mark completed' });
    }
  },

  // DELETE /api/watches/:profileId/:contentId
  async remove(req, res) {
    try {
      const { profileId, contentId } = req.params;
      await WatchesModel.remove(profileId, contentId);
      res.status(204).end();
    } catch (err) {
      console.error('remove watch error:', err);
      res.status(500).json({ error: 'Failed to delete watch' });
    }
  }
};

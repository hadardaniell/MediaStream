import { EpisodesModel } from '../models/episodesModel.js';
import { ContentModel } from '../models/contentModel.js';
import { getDb } from '../db.js';
import { ObjectId, Int32 } from 'mongodb';

export const list = async (req, res) => {
  const { contentId } = req.params;
  const { season } = req.query;
  const eps = await EpisodesModel.listByContent(contentId, { season });
  res.json(eps);
};

export const create = async (req, res) => {
  const { contentId } = req.params;
  const { seasonNumber, episodeNumber, shortDescription, video } = req.body;

  // sanity: content exists and is a series
  const c = await ContentModel.getById(contentId);
  if (!c) return res.status(404).json({ error: 'Content not found' });
  if (c.type !== 'series') return res.status(400).json({ error: 'Content is not a series' });

  if (!seasonNumber || !episodeNumber || !shortDescription || !video) {
    return res.status(400).json({ error: 'seasonNumber, episodeNumber, shortDescription, video are required' });
  }

  try {
    const ep = await EpisodesModel.create({ contentId, seasonNumber, episodeNumber, shortDescription, video });
    res.status(201).json(ep);
  } catch (e) {
    if (String(e).includes('E11000')) {
      return res.status(409).json({ error: 'Episode already exists for this content/season/number' });
    }
    res.status(400).json({ error: e.message });
  }
};

export const bulkCreate = async (req, res) => {
  const { contentId } = req.params;

  // Accept either { episodes: [...] } or just [...]
  const payload = Array.isArray(req.body) ? req.body : req.body.episodes;
  if (!Array.isArray(payload) || payload.length === 0) {
    return res.status(400).json({ error: 'Provide an array of episodes' });
  }

  // sanity: content exists & is series
  const content = await ContentModel.getById(contentId);
  if (!content) return res.status(404).json({ error: 'Content not found' });
  if (content.type !== 'series') return res.status(400).json({ error: 'Content is not a series' });

  // basic validation + coercion + in-payload de-dup
  const now = new Date();
  const seen = new Set();
  const docs = [];
  const rejects = [];

  for (const [i, ep] of payload.entries()) {
    const { seasonNumber, episodeNumber, shortDescription, video } = ep ?? {};
    const key = `${seasonNumber}#${episodeNumber}`;

    if (!seasonNumber || !episodeNumber || !shortDescription || !video) {
      rejects.push({ index: i, error: 'Missing required fields (seasonNumber, episodeNumber, shortDescription, video)' });
      continue;
    }
    if (seen.has(key)) {
      rejects.push({ index: i, error: 'Duplicate in request (same seasonNumber+episodeNumber)' });
      continue;
    }
    seen.add(key);

    docs.push({
      contentId: new ObjectId(String(contentId)),
      seasonNumber: new Int32(Number(seasonNumber)),
      episodeNumber: new Int32(Number(episodeNumber)),
      shortDescription: String(shortDescription),
      video: String(video),
      createdAt: now,
      updatedAt: now,
    });
  }

  if (docs.length === 0) {
    return res.status(400).json({ error: 'No valid episodes to insert', rejects });
  }

  // insertMany with ordered:false so one dup doesn’t abort whole batch
  const db = await getDb();
  try {
    const result = await db.collection('Episodes').insertMany(docs, { ordered: false });
    // Map inserted ids back to input indexes
    const inserted = Object.values(result.insertedIds).map((id, idx) => ({
      index: idx,
      _id: id,
    }));

    return res.status(200).json({
      ok: true,
      insertedCount: inserted.length,
      rejectedCount: rejects.length,
      inserted,
      rejects
    });
  } catch (e) {
    // Handle partial success + duplicate key errors
    const writeErrors = e?.writeErrors ?? [];
    const dupes = writeErrors
      .filter(w => String(w.code) === '11000')
      .map(w => ({ index: w.index, error: 'Duplicate (contentId, seasonNumber, episodeNumber)' }));

    // Some may still have been inserted even with errors
    const insertedIds = e?.result?.result?.insertedIds ?? e?.result?.insertedIds ?? {};
    const inserted = Object.entries(insertedIds).map(([k, v]) => ({ index: Number(k), _id: v }));

    return res.status(207).json({ // Multi-Status style response
      ok: false,
      insertedCount: inserted.length,
      errorCount: writeErrors.length + rejects.length,
      inserted,
      rejects: rejects.concat(dupes),
      message: 'Bulk insert partially succeeded'
    });
  }
};

export const update = async (req, res) => {
  const ep = await EpisodesModel.updateById(req.params.id, req.body);
  if (!ep) return res.status(404).json({ error: 'Not found' });
  res.json(ep);
};

export const remove = async (req, res) => {
  const ok = await EpisodesModel.deleteById(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
};

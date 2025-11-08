// controllers/contentController.js
import { ContentModel } from '../models/contentModel.js';
import { EpisodesModel } from '../models/episodesModel.js';
import { Int32, ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { syncImdbRatingForContent } from '../services/ratingsService.js';

// allow only schema fields
const ALLOWED_FIELDS = [
  'name','type','year','photo','genres','description','cast','director','likes','externalIds','rating'
]; 

const pick = (obj, allowed) =>
  Object.fromEntries(Object.entries(obj ?? {}).filter(([k]) => allowed.includes(k)));

const TYPE_ENUM = ['series','movie'];
const GENRE_ENUM = ['Action','Animation','Comedy','Crime','Documentary','Horror','Romance','Sci-Fi'];
const WIKI_RE   = /^https?:\/\/[a-z\-]+\.wikipedia\.org\/.+/;
const PHOTO_RE  = /^(?:\/|https?:\/\/).+\.(?:png|jpg|jpeg|webp)$/i;
const VIDEO_RE = /^(?:\/|https?:\/\/).+\.(?:mp4)$/i;

const toInt = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};
const toNumber = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};
const trimStr = (s) => String(s).trim();

// ---- field validators ----
function validateDirector(obj) {
  if (obj == null || typeof obj !== 'object') return 'director must be an object';
  const { name, wikipedia } = obj;
  if (name == null || trimStr(name) === '') return 'director.name is required';
  if (wikipedia != null && !WIKI_RE.test(String(wikipedia))) return 'director.wikipedia must be a valid Wikipedia URL';
  return null;
}
function validateCast(arr) {
  if (!Array.isArray(arr) || arr.length < 1) return 'cast must be a non-empty array';
  for (let i = 0; i < arr.length; i++) {
    const m = arr[i];
    if (m == null || typeof m !== 'object') return `cast[${i}] must be an object`;
    if (m.name == null || trimStr(m.name) === '') return `cast[${i}].name is required`;
    if (m.wikipedia == null || !WIKI_RE.test(String(m.wikipedia)))
      return `cast[${i}].wikipedia must be a valid Wikipedia URL`;
    // strip extra props
    arr[i] = { name: trimStr(m.name), wikipedia: String(m.wikipedia) };
  }
  return null;
}
function validateGenres(arr) {
  if (!Array.isArray(arr) || arr.length < 1) return 'genres must be a non-empty array';
  const seen = new Set();
  for (let i = 0; i < arr.length; i++) {
    const g = String(arr[i]);
    if (!GENRE_ENUM.includes(g)) return `genres[${i}] must be one of: ${GENRE_ENUM.join(', ')}`;
    if (seen.has(g)) return 'genres must contain unique items';
    seen.add(g);
  }
  return null;
}
function validateSeasons(arr) {
  if (!Array.isArray(arr) || arr.length < 1) return 'seasons must be a non-empty array';
  for (let i = 0; i < arr.length; i++) {
    const s = arr[i];
    if (s == null || typeof s !== 'object') return `seasons[${i}] must be an object`;
    const seasonNumber = toInt(s.seasonNumber);
    const episodesCount = toInt(s.episodesCount);
    if (seasonNumber == null || seasonNumber < 1) return `seasons[${i}].seasonNumber must be int >= 1`;
    if (episodesCount == null || episodesCount < 1) return `seasons[${i}].episodesCount must be int >= 1`;
    let year = s.year == null ? null : toInt(s.year);
    if (year != null && (year < 1888 || year > 2100)) return `seasons[${i}].year must be between 1888 and 2100`;
    const clean = { seasonNumber, episodesCount };
    if (year != null) clean.year = year;
    if (s.notes != null) {
      const notes = trimStr(s.notes);
      if (notes.length > 500) return `seasons[${i}].notes max length is 500`;
      if (notes) clean.notes = notes;
    }
    arr[i] = clean;
  }
  return null;
}

//This is for the external IMDB ratings IDs
function validateExternalIds(obj) {
  if (obj == null) return null; // optional
  if (typeof obj !== 'object') return 'externalIds must be an object';
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'string' && typeof v !== 'number') {
      return `externalIds.${k} must be a string or number`;
    }
  }
  return null;
}

export const ContentController = {
  // ✅ GET /api/content

   async getByProfile(req, res) {
    try {
      const { profileId } = req.params;
      if (!ObjectId.isValid(profileId)) {
        return res.status(400).json({ error: 'Invalid profileId' });
      }
      const pid = new ObjectId(profileId);

      const db = await getDb();
      const filter = {};
      const sort = {};

        if (req.query.type) filter.type = req.query.type;

        if (req.query.genre) {
      const genres = String(req.query.genre)
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(g => g.trim())
        .filter(Boolean);
        filter.genres = { $in: genres }; // OR condition
      }

        if (req.query.year) filter.year = parseInt(req.query.year, 10);
        if (req.query.sortBy === 'rating') sort.rating = -1;
        if (req.query.sortBy === 'year')   sort.year   = -1;
        if (req.query.sortBy === 'likes')  sort.likes  = -1;
      // Adjust collection names if yours differ (e.g., 'Likes' vs 'likes', 'Watches' vs 'watches')
      const cursor = db.collection('Content').aggregate([
        Object.keys(filter).length ? { $match: filter } : null,
        Object.keys(sort).length ? { $sort: sort } : null,
        
        // Join Likes for *this* profile
        {
          $lookup: {
            from: 'Likes',
            let: { contentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$contentId', '$$contentId'] },
                      { $eq: ['$profileId', pid] }
                    ]
                  }
                }
              },
              { $project: { _id: 1 } }
            ],
            as: 'likesForProfile'
          }
        },
        // Join Watches for *this* profile
        {
          $lookup: {
            from: 'watches',
            let: { contentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$contentId', '$$contentId'] },
                      { $eq: ['$profileId', pid] }
                    ]
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  status: 1,
                  progressSeconds: 1,
                  seasonNumber: 1,
                  episodeNumber: 1,
                  updatedAt: 1,
                  lastWatchedAt: 1
                }
              }
            ],
            as: 'watchForProfile'
          }
        },
        // Compute booleans/objects
        {
          $addFields: {
            hasLike: { $gt: [{ $size: '$likesForProfile' }, 0] },
            watch: {
              $ifNull: [
                { $arrayElemAt: ['$watchForProfile', 0] },
                { status: 'unstarted' }
              ]
            }
          }
        },
        { $project: { likesForProfile: 0, watchForProfile: 0 } },
        // Optional: sorting (e.g., newest first, or by rating)
        // { $sort: { year: -1 } }
      ].filter(Boolean)); // remove null stages

      const results = await cursor.toArray();
      return res.json(results);
    } catch (err) {
      console.error('getByProfile error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
  async getAll(req, res) {
    try {
      const filter = {};
      const sort = {};
      if (req.query.type) filter.type = req.query.type;

    if (req.query.genre) {
      const genres = String(req.query.genre)
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(g => g.trim())
      .filter(Boolean);

  filter.genres = { $in: genres }; // OR condition
}

      if (req.query.year)  filter.year  = parseInt(req.query.year, 10);
      if (req.query.sortBy === 'rating') sort.rating = -1;
      if (req.query.sortBy === 'year')   sort.year   = -1;
      if (req.query.sortBy === 'likes')  sort.likes  = -1;

      const content = await ContentModel.getAll(filter, sort);
      res.json(content);
    } catch (err) {
      console.error('❌ Error fetching content:', err);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  },

  async getPopular(req, res) {
    try {
      const {
        mode = 'likes',
        limit = '10',
        type,
        genre,
        minRating,
        wLikes,
        wRating
      } = req.query;

  
      const genres = genre
        ? String(genre)
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map(g => g.trim())
            .filter(Boolean)
        : undefined;

      const data = await ContentModel.getPopular({
        mode,
        limit: Number(limit),
        type,
        genres,
        minRating: minRating !== undefined ? Number(minRating) : undefined,
        wLikes: wLikes !== undefined ? Number(wLikes) : undefined,
        wRating: wRating !== undefined ? Number(wRating) : undefined
      });

      return res.json(data);
    } catch (err) {
      console.error('getPopular error:', err);
      return res.status(500).json({ error: 'Failed to fetch popular content' });
    }
  },

// ✅ GET /api/content/:id[?include=episodes,episodesCount]
async getById(req, res) {
try {
    const { id } = req.params;
    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const item = await ContentModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Content not found' });

    // Parse include list: e.g., ?include=episodes,seasons,episodesCount,totals
    const include = String(req.query.include || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Only fetch episodes if the client asked for something that needs them
    const wants = new Set(include);
    const needsEpisodes =
      item.type === 'series' &&
      (wants.has('episodes') || wants.has('episodesCount') || wants.has('seasons') || wants.has('totals'));

    let eps = null;
    if (needsEpisodes) {
      eps = await EpisodesModel.listByContent(item._id); // one DB hit
    }

    if (wants.has('episodes') && eps) {
      item.episodes = eps;
    }

    if ((wants.has('episodesCount') || wants.has('totals')) && eps) {
      item.episodesCount = eps.length;
    }

    if ((wants.has('seasons') || wants.has('totals')) && eps) {
      // Build seasons array from episodes
      const counts = new Map();
      for (const e of eps) {
        counts.set(e.seasonNumber, (counts.get(e.seasonNumber) || 0) + 1);
      }
      item.seasons = [...counts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([seasonNumber, episodesCount]) => ({ seasonNumber, episodesCount }));

      item.totalSeasons = item.seasons.length;
      item.totalEpisodes = eps.length;
    }

    return res.json(item);
  } catch (err) {
    console.error('❌ Error fetching content by ID:', err);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
},


  // ➕ POST /api/content
  async create(req, res) {
    try {
      const body = pick(req.body, ALLOWED_FIELDS);

      // required roots
      if (body.name == null || trimStr(body.name) === '') return res.status(400).json({ error: 'name is required' });
      if (body.type == null || !TYPE_ENUM.includes(String(body.type))) return res.status(400).json({ error: 'type must be "series" or "movie"' });
      if (body.year == null) return res.status(400).json({ error: 'year is required' });
      if (body.photo == null || !PHOTO_RE.test(String(body.photo))) return res.status(400).json({ error: 'photo must be a valid URL or path ending with .png/.jpg/.jpeg/.webp' });
      if (body.genres == null) return res.status(400).json({ error: 'genres is required' });
      if (body.description == null || trimStr(body.description) === '') return res.status(400).json({ error: 'description is required' });
      if (body.cast == null) return res.status(400).json({ error: 'cast is required' });
      if (body.director == null) return res.status(400).json({ error: 'director is required' });

      // normalize scalars
      body.name = trimStr(body.name);
      body.type = String(body.type);

      const y = toInt(body.year);
      if (y == null || y < 1888 || y > 2100)
        return res.status(400).json({ error: 'year must be an integer between 1888 and 2100' });
      // BSON int
      body.year = new Int32(y);


      body.photo = String(body.photo);
      body.video = String(body.video);

      // normalize arrays/objects
      if (!Array.isArray(body.genres)) body.genres = [String(body.genres)];
      const genresErr = validateGenres(body.genres);
      if (genresErr) return res.status(400).json({ error: genresErr });

      const directorErr = validateDirector(body.director);
      if (directorErr) return res.status(400).json({ error: directorErr });
      body.director = {
        name: trimStr(body.director.name),
        ...(body.director.wikipedia ? { wikipedia: String(body.director.wikipedia) } : {})
      };

      const castErr = validateCast(body.cast);
      if (castErr) return res.status(400).json({ error: castErr });

      const externalIdsErr = validateExternalIds(body.externalIds);
      if (externalIdsErr) return res.status(400).json({ error: externalIdsErr });
    

      // defaults (BSON int)
      body.likes = new Int32(0);

      // do NOT add createdAt/updatedAt unless they exist in schema

      const created = await ContentModel.create(body);
      return res.status(201).json(created);
    } catch (err) {
      console.error('❌ create:', err);
      if (err?.errInfo) console.error('Validation details:', JSON.stringify(err.errInfo, null, 2));
      return res.status(500).json({ error: 'Failed to create content' });
    }
  },

  //create series with episodes:

    async createSeriesWithEpisodes(req, res) {
    const atomic = String(req.query.atomic ?? 'true') !== 'false'; // default true

    try {
      // -----------------------------
      // 1) VALIDATE & BUILD CONTENT DOC (mirrors create())
      // -----------------------------
      const body = pick(req.body?.content, ALLOWED_FIELDS);
      if (!body) return res.status(400).json({ error: 'Provide content in body.content' });

      if (body.name == null || trimStr(body.name) === '') return res.status(400).json({ error: 'name is required' });
      if (body.type == null || !TYPE_ENUM.includes(String(body.type))) return res.status(400).json({ error: 'type must be "series" or "movie"' });
      if (String(body.type) !== 'series') return res.status(400).json({ error: 'type must be "series" for this endpoint' });
      if (body.year == null) return res.status(400).json({ error: 'year is required' });
      if (body.photo == null || !PHOTO_RE.test(String(body.photo))) return res.status(400).json({ error: 'photo must be a valid URL or path ending with .png/.jpg/.jpeg/.webp' });
      if (body.genres == null) return res.status(400).json({ error: 'genres is required' });
      if (body.description == null || trimStr(body.description) === '') return res.status(400).json({ error: 'description is required' });
      if (body.cast == null) return res.status(400).json({ error: 'cast is required' });
      if (body.director == null) return res.status(400).json({ error: 'director is required' });

      body.name = trimStr(body.name);
      body.type = String(body.type);

      const y = toInt(body.year);
      if (y == null || y < 1888 || y > 2100)
        return res.status(400).json({ error: 'year must be an integer between 1888 and 2100' });
      body.year = new Int32(y);


      body.photo = String(body.photo);
      body.video = String(body.video);

      if (!Array.isArray(body.genres)) body.genres = [String(body.genres)];
      {
        const err = validateGenres(body.genres);
        if (err) return res.status(400).json({ error: err });
      }

      {
        const err = validateDirector(body.director);
        if (err) return res.status(400).json({ error: err });
        body.director = {
          name: trimStr(body.director.name),
          ...(body.director.wikipedia ? { wikipedia: String(body.director.wikipedia) } : {})
        };
      }

      {
        const err = validateCast(body.cast);
        if (err) return res.status(400).json({ error: err });
      }

      {
        const err = validateExternalIds(body.externalIds);
        if (err) return res.status(400).json({ error: err });
      }

      body.likes = new Int32(0);

      // -----------------------------
      // 2) CREATE CONTENT
      // -----------------------------
      const createdContent = await ContentModel.create(body);

      // -----------------------------
      // 3) BULK CREATE EPISODES (reuse your bulk pattern)
      // -----------------------------
      const episodesPayload = Array.isArray(req.body?.episodes) ? req.body.episodes : [];
      if (episodesPayload.length === 0) {
        return res.status(201).json({
          content: createdContent,
          episodes: { ok: true, insertedCount: 0, rejectedCount: 0, inserted: [], rejects: [] }
        });
      }

      const contentId = createdContent._id;
      const now = new Date();
      const seen = new Set();
      const docs = [];
      const rejects = [];

      for (const [i, ep] of episodesPayload.entries()) {
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
        if (atomic) {
          await ContentModel.deleteById(String(contentId)); // roll back
          return res.status(400).json({ error: 'No valid episodes to insert', rejects });
        }
        return res.status(201).json({
          content: createdContent,
          episodes: { ok: false, insertedCount: 0, rejectedCount: rejects.length, inserted: [], rejects, message: 'No valid episodes to insert' }
        });
      }

      const db = await getDb();
      try {
        const result = await db.collection('Episodes').insertMany(docs, { ordered: false });
        const inserted = Object.values(result.insertedIds).map((id, idx) => ({ index: idx, _id: id }));
        return res.status(201).json({
          content: createdContent,
          episodes: {
            ok: true,
            insertedCount: inserted.length,
            rejectedCount: rejects.length,
            inserted,
            rejects
          }
        });
      } catch (e) {
        const writeErrors = e?.writeErrors ?? [];
        const dupes = writeErrors
          .filter(w => String(w.code) === '11000')
          .map(w => ({ index: w.index, error: 'Duplicate (contentId, seasonNumber, episodeNumber)' }));

        const insertedIds = e?.result?.result?.insertedIds ?? e?.result?.insertedIds ?? {};
        const inserted = Object.entries(insertedIds).map(([k, v]) => ({ index: Number(k), _id: v }));

        if (atomic) {
          await ContentModel.deleteById(String(createdContent._id)); // roll back content
          return res.status(207).json({
            error: 'Bulk episodes failed; content rolled back (atomic mode)',
            episodes: {
              ok: false,
              insertedCount: inserted.length,
              errorCount: writeErrors.length + rejects.length,
              inserted,
              rejects: rejects.concat(dupes),
              message: 'Bulk insert partially/fully failed'
            }
          });
        }
        return res.status(207).json({
          content: createdContent,
          episodes: {
            ok: false,
            insertedCount: inserted.length,
            errorCount: writeErrors.length + rejects.length,
            inserted,
            rejects: rejects.concat(dupes),
            message: 'Bulk insert partially/fully failed'
          }
        });
      }
    } catch (err) {
      console.error('❌ createSeriesWithEpisodes:', err);
      if (err?.errInfo) console.error('Validation details:', JSON.stringify(err.errInfo, null, 2));
      return res.status(500).json({ error: 'Failed to create series with episodes' });
    }
  },

  // ✏️ PATCH /api/content/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Invalid id' });

      const updates = pick(req.body, ALLOWED_FIELDS);
      if (Object.keys(updates).length === 0)
        return res.status(400).json({ error: 'No updatable fields provided' });

      if ('name' in updates && updates.name != null) {
        updates.name = trimStr(updates.name);
        if (updates.name === '') return res.status(400).json({ error: 'name cannot be empty' });
      }

      if ('type' in updates) {
        if (!TYPE_ENUM.includes(String(updates.type)))
          return res.status(400).json({ error: 'type must be "series" or "movie"' });
      }

      if ('year' in updates && updates.year != null) {
        const y = toInt(updates.year);
        if (y == null || y < 1888 || y > 2100)
          return res.status(400).json({ error: 'year must be an integer between 1888 and 2100' });
        updates.year = new Int32(y); // BSON int
      }

      if ('photo' in updates && updates.photo != null) {
        updates.photo = String(updates.photo);
        if (!PHOTO_RE.test(updates.photo))
          return res.status(400).json({ error: 'photo must be a valid image URL/path' });
      }

      if ('likes' in updates) {
        const n = toInt(updates.likes);
        if (n == null || n < 0) return res.status(400).json({ error: 'likes must be int >= 0' });
        updates.likes = new Int32(n); // BSON int
      }

      if ('genres' in updates && updates.genres != null) {
        if (!Array.isArray(updates.genres) || updates.genres.length === 0)
          return res.status(400).json({ error: 'genres must be a non-empty array' });
        const err = validateGenres(updates.genres);
        if (err) return res.status(400).json({ error: err });
      }

      if ('director' in updates && updates.director != null) {
        const err = validateDirector(updates.director);
        if (err) return res.status(400).json({ error: err });
        updates.director = {
          name: trimStr(updates.director.name),
          ...(updates.director.wikipedia ? { wikipedia: String(updates.director.wikipedia) } : {})
        };
      }

      if ('cast' in updates && updates.cast != null) {
        const err = validateCast(updates.cast);
        if (err) return res.status(400).json({ error: err });
      }

      if ('externalIds' in updates && updates.externalIds != null) {
        const externalIdsErr = validateExternalIds(updates.externalIds);
        if (externalIdsErr) return res.status(400).json({ error: externalIdsErr });
      }

      // do NOT set updatedAt unless schema includes it

      const doc = await ContentModel.updateById(id, updates);
      if (!doc) return res.status(404).json({ error: 'Content not found' });
      return res.json(doc);
    } catch (err) {
      console.error('❌ update:', err);
      if (err?.errInfo) console.error('Validation details:', JSON.stringify(err.errInfo, null, 2));
      return res.status(500).json({ error: 'Failed to update content' });
    }
  },

// 🗑️ DELETE /api/content/:id  — deletes Content + related Likes & Watches
  async remove(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(String(id))) {
        return res.status(400).json({ error: 'Invalid id' });
      }

      const outcome = await ContentModel.deleteCascadeById(id);
      if (!outcome.deleted) {
        return res.status(404).json({ error: 'Content not found' });
      }

      return res.status(204).send();
    } catch (err) {
      console.error('❌ remove (cascade):', err);
      return res.status(500).json({ error: 'Failed to delete content' });
    }
  },
  
  // ✅ POST /api/content/:id/sync-rating?source=imdb
async syncRating(req, res) {
  try {
    const { id } = req.params;
    const { source = 'imdb' } = req.query;
    if (!ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Invalid id' });
    if (source !== 'imdb') return res.status(400).json({ error: 'Unsupported source; use source=imdb' });

    const result = await syncImdbRatingForContent(id);
    if (!result.ok) {
      const map = { NOT_FOUND: 404, MISSING_IMDB_ID: 400, MISSING_OMDB_KEY: 500, NO_RATING: 404 };
      return res.status(map[result.reason] || 500).json({ error: `Sync failed: ${result.reason}` });
    }
    return res.json({ ok: true, rating: result.rating, votes: result.votes });
  } catch (err) {
    console.error('syncRating error:', err);
    return res.status(500).json({ error: 'Failed to sync rating' });
  }
},

// ✅ POST /api/content/sync-ratings?source=imdb[&type=movie|series][&genre=[Action,Comedy]][&ids=tt1,tt2]
async syncRatingsBatch(req, res) {
  try {
    const { source = 'imdb', type, genre, ids } = req.query;
    if (source !== 'imdb') return res.status(400).json({ error: 'Unsupported source; use source=imdb' });

    const db = await getDb();
    const filter = {};
    if (type) filter.type = type;

    if (genre) {
      const genres = String(genre).replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);
      if (genres.length) filter.genres = { $in: genres };
    }

    if (ids) {
      // allow targeting by IMDb ID list
      const imdbIds = String(ids).split(',').map(s => s.trim()).filter(Boolean);
      if (imdbIds.length) filter['externalIds.imdb'] = { $in: imdbIds };
    } else {
      // require presence of imdb id
      filter['externalIds.imdb'] = { $exists: true, $ne: null };
    }

    const contents = await db.collection('Content').find(filter, { projection: { _id: 1 } }).toArray();
    const idsToSync = contents.map(c => c._id.toString());

    const results = [];
    for (const cid of idsToSync) {
      // naive throttle to be nice to OMDb
      // eslint-disable-next-line no-await-in-loop
      const r = await syncImdbRatingForContent(cid);
      results.push({ id: cid, ...r });
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 250)); // ~4 req/s
    }

    const summary = {
      total: results.length,
      ok: results.filter(x => x.ok).length,
      failed: results.filter(x => !x.ok).length
    };
    return res.json({ summary, results });
  } catch (err) {
    console.error('syncRatingsBatch error:', err);
    return res.status(500).json({ error: 'Failed to batch sync ratings' });
  }
},

};

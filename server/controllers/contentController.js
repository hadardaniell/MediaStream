// controllers/contentController.js
import { ContentModel } from '../models/contentModel.js';
import { EpisodesModel } from '../models/episodesModel.js';
import { Int32, ObjectId } from 'mongodb';
import { getDb } from '../db.js'

// allow only schema fields
const ALLOWED_FIELDS = [
  'name','type','year','photo','video','genres','description','cast','director',
  'rating','likes','seasons','totalSeasons','totalEpisodes'
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
      // Adjust collection names if yours differ (e.g., 'Likes' vs 'likes', 'Watches' vs 'watches')
      const cursor = db.collection('Content').aggregate([
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
      ]);

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
      .replace(/^\[|\]$/g, '')      // tolerate [Action,Comedy]
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

// ✅ GET /api/content/:id[?include=episodes,episodesCount]
async getById(req, res) {
  try {
    const item = await ContentModel.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Content not found' });

    // Parse include list: e.g., ?include=episodes or ?include=episodes,episodesCount
    const include = String(req.query.include || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Optional: episodesCount without full list
    if (item.type === 'series' && (include.includes('episodesCount') || include.includes('episodes'))) {
      const eps = await EpisodesModel.listByContent(item._id);
      if (include.includes('episodes')) item.episodes = eps;
      item.episodesCount = eps.length;
    }

    res.json(item);
  } catch (err) {
    console.error('❌ Error fetching content by ID:', err);
    res.status(500).json({ error: 'Failed to fetch content' });
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
      if (body.video == null || !VIDEO_RE.test(String(body.video))) return res.status(400).json({ error: 'Video must be a valid URL or path ending with .mp4' });
      if (body.genres == null) return res.status(400).json({ error: 'genres is required' });
      if (body.description == null || trimStr(body.description) === '') return res.status(400).json({ error: 'description is required' });
      if (body.cast == null) return res.status(400).json({ error: 'cast is required' });
      if (body.director == null) return res.status(400).json({ error: 'director is required' });
      if (body.rating == null) return res.status(400).json({ error: 'rating is required' });

      // normalize scalars
      body.name = trimStr(body.name);
      body.type = String(body.type);

      const y = toInt(body.year);
      if (y == null || y < 1888 || y > 2100)
        return res.status(400).json({ error: 'year must be an integer between 1888 and 2100' });
      // BSON int
      body.year = new Int32(y);

      const r = toNumber(body.rating);
      if (r == null || r < 0 || r > 5)
        return res.status(400).json({ error: 'rating must be a number between 0 and 5' });
      body.rating = r;

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

      // type-specific: series must have seasons; movie must not
      if (body.type === 'series') {
        if (body.seasons == null) return res.status(400).json({ error: 'seasons is required for type=series' });

        const seasonsErr = validateSeasons(body.seasons);
        if (seasonsErr) return res.status(400).json({ error: seasonsErr });

        // cast season ints to Int32 for DB
        body.seasons = body.seasons.map((s) => ({
          seasonNumber: new Int32(s.seasonNumber),
          episodesCount: new Int32(s.episodesCount),
          ...(s.year != null ? { year: new Int32(s.year) } : {}),
          ...(s.notes ? { notes: s.notes } : {})
        }));

        if (body.totalSeasons == null) {
          body.totalSeasons = new Int32(body.seasons.length);
        } else {
          const ts = toInt(body.totalSeasons);
          if (ts == null || ts < 1) return res.status(400).json({ error: 'totalSeasons must be int >= 1' });
          body.totalSeasons = new Int32(ts);
        }

        if (body.totalEpisodes == null) {
          const computed = body.seasons.reduce((a, s) => a + s.episodesCount.valueOf(), 0);
          body.totalEpisodes = new Int32(computed);
        } else {
          const te = toInt(body.totalEpisodes);
          if (te == null || te < 1) return res.status(400).json({ error: 'totalEpisodes must be int >= 1' });
          body.totalEpisodes = new Int32(te);
        }
      } else {
        if (body.seasons != null) return res.status(400).json({ error: 'seasons must not be provided for type=movie' });
        delete body.totalSeasons;
        delete body.totalEpisodes;
      }

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
      if ('video' in updates && updates.video != null) {
        updates.video = String(updates.video);
        if (!VIDEO_RE.test(updates.video))
          return res.status(400).json({ error: 'Video must be a valid mp4 URL/path' });
      }

      if ('rating' in updates && updates.rating != null) {
        const r = toNumber(updates.rating);
        if (r == null || r < 0 || r > 5)
          return res.status(400).json({ error: 'rating must be 0..5' });
        updates.rating = r;
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

      if ('seasons' in updates) {
        if (updates.seasons != null) {
          const err = validateSeasons(updates.seasons);
          if (err) return res.status(400).json({ error: err });
          // cast nested ints to Int32
          updates.seasons = updates.seasons.map((s) => ({
            seasonNumber: new Int32(s.seasonNumber),
            episodesCount: new Int32(s.episodesCount),
            ...(s.year != null ? { year: new Int32(s.year) } : {}),
            ...(s.notes ? { notes: s.notes } : {})
          }));
        }
      }

      if ('totalSeasons' in updates && updates.totalSeasons != null) {
        const ts = toInt(updates.totalSeasons);
        if (ts == null || ts < 1)
          return res.status(400).json({ error: 'totalSeasons must be int >= 1' });
        updates.totalSeasons = new Int32(ts);
      }

      if ('totalEpisodes' in updates && updates.totalEpisodes != null) {
        const te = toInt(updates.totalEpisodes);
        if (te == null || te < 1)
          return res.status(400).json({ error: 'totalEpisodes must be int >= 1' });
        updates.totalEpisodes = new Int32(te);
      }

      // movie vs series constraints on update
      if (updates.type === 'movie' && updates.seasons != null) {
        return res.status(400).json({ error: 'seasons must not be provided for type=movie' });
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

  // 🗑️ DELETE /api/content/:id
  async remove(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Invalid id' });

      const ok = await ContentModel.deleteById(id);
      if (!ok) return res.status(404).json({ error: 'Content not found' });

      return res.status(204).send();
    } catch (err) {
      console.error('❌ remove:', err);
      return res.status(500).json({ error: 'Failed to delete content' });
    }
  },
};

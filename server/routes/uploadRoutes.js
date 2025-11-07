// routes/uploads.js (ESM)
import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const router = express.Router();

// Base dirs (relative to project root)
const DEST = {
  movie:           '../client/assets/movies',
  poster:          '../client/assets/posters',
  'profile-photo': '../client/assets/profiles-photos',
  episode:         '../client/assets/series', // we'll add /<series-slug> and file name s<season>e<episode>.<ext>
};

const ALLOWED = {
  movie:           ['video/mp4', 'application/octet-stream'],
  poster:          ['image/jpeg','image/png','image/webp','application/octet-stream'],
  'profile-photo': ['image/jpeg','image/png','image/webp','application/octet-stream'],
  episode:         ['video/mp4', 'application/octet-stream'],
};

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function safeName(original) {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9_\-]+/g, '_') || 'upload';
  return `${base}${ext}`;
}

function slugifyDir(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'series';
}

function parsePositiveInt(x) {
  const n = Number(x);
  return (Number.isInteger(n) && n >= 1) ? n : null;
}

// IMPORTANT: no JSON/body parsers here; we need the raw stream.
router.post('/:type', async (req, res) => {
  try {
    const type = req.params.type;
    if (!DEST[type]) {
      return res.status(400).json({ error: 'Unknown upload type (movie | poster | profile-photo | episode)' });
    }

    const contentType = req.headers['content-type'] || '';
    if (!ALLOWED[type].includes(contentType)) {
      if (contentType !== 'application/octet-stream') {
        return res.status(415).json({ error: `Invalid Content-Type for ${type}` });
      }
    }

    const originalName = req.headers['x-filename'];
    if (!originalName) return res.status(400).json({ error: 'Missing X-Filename header' });

    let absPath, publicPath;

    if (type === 'episode') {
      // Expect series + season/episode via headers; file will be written as s<season>e<episode>.<ext>
      const seriesName = req.headers['x-series-name'];
      const seasonHdr  = req.headers['x-season'];
      const episodeHdr = req.headers['x-episode'];

      if (!seriesName) return res.status(400).json({ error: 'Missing X-Series-Name header' });

      const season  = parsePositiveInt(seasonHdr);
      const episode = parsePositiveInt(episodeHdr);
      if (!season)  return res.status(400).json({ error: 'X-Season must be an integer >= 1' });
      if (!episode) return res.status(400).json({ error: 'X-Episode must be an integer >= 1' });

      const ext = path.extname(originalName).toLowerCase() || '.mp4'; // default to .mp4 if missing
      const seriesSlug = slugifyDir(seriesName);
      const baseDir    = path.join(__dirname, '..', DEST.episode, seriesSlug);
      await ensureDir(baseDir);

      const fileStem  = `s${season}e${episode}`;
      const filename  = `${fileStem}${ext}`; // <-- your required naming
      absPath   = path.join(baseDir, filename);
      publicPath = `/assets/series/${seriesSlug}/${filename}`;

    } else {
      // movie/poster/profile-photo as before
      const destDir = path.join(__dirname, '..', DEST[type]);
      await ensureDir(destDir);

      const filename = safeName(originalName);
      absPath = path.join(destDir, filename);

      const publicBase =
        type === 'profile-photo' ? 'profile-photos'
        : type === 'movie' ? 'movies'
        : type; // poster -> posters already handled in DEST path
      publicPath = `/assets/${publicBase}/${filename}`;
    }

    const writeStream = fs.createWriteStream(absPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.status(201).json({
        ok: true,
        type,
        path: publicPath,
        filename: path.basename(absPath),
      });
    });

    writeStream.on('error', (err) => {
      console.error('Write error:', err);
      res.status(500).json({ error: 'Failed to save file' });
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;

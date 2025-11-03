// routes/uploads.js (ESM)
import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const router = express.Router();

// Map type -> destination directory (relative to project root)
const DEST = {
  movie:          '../client/assets/movies',
  poster:         '../client/assets/posters',
  'profile-photo':'../client/assets/profiles-photos',
};

// Allowed content-types per type (lightweight guard)
const ALLOWED = {
  movie:          ['video/mp4', 'application/octet-stream'], // octet-stream allowed for simplicity
  poster:         ['image/jpeg','image/png','image/webp','application/octet-stream'],
  'profile-photo':['image/jpeg','image/png','image/webp','application/octet-stream'],
};

// Utility: ensure dir exists
async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

// Utility: sanitize filename to kebab + timestamp
function safeName(original) {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext)
    .replace(/[^a-zA-Z0-9_\-]+/g, '_') // keep name safe for filesystem
    || 'upload';
  return `${base}${ext}`;
}

// IMPORTANT: this route must NOT use JSON body parsers or your ensureJson middleware.
// We explicitly want the raw request stream.
router.post('/:type', async (req, res) => {
  try {
    const type = req.params.type;
    if (!DEST[type]) return res.status(400).json({ error: 'Unknown upload type (movie | poster | profile-photo)' });

    const contentType = req.headers['content-type'] || '';
    if (!ALLOWED[type].includes(contentType)) {
      // We’re strict only if it’s not octet-stream; octet-stream is accepted for compatibility
      if (contentType !== 'application/octet-stream') {
        return res.status(415).json({ error: `Invalid Content-Type for ${type}` });
      }
    }

    const originalName = req.headers['x-filename'];
    if (!originalName) return res.status(400).json({ error: 'Missing X-Filename header' });

    const destDir = path.join(__dirname, '..', DEST[type]);
    await ensureDir(destDir);

    const filename = safeName(originalName);
    const absPath  = path.join(destDir, filename);

    // Stream the raw request body into the file (no buffering in memory)
    const writeStream = fs.createWriteStream(absPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      // Convert to public URL: /assets/<kind>/<filename>
      const assetsIndex = absPath.split(path.sep).lastIndexOf('assets'); // not reliable across OS, so:
      // Simpler: build from known type:
      const publicPath = `/assets/${type === 'profile-photo' ? 'profile-photos' : (type + (type==='movie' ? 's' : ''))}/${filename}`
        .replace('moviess','movies') // guard against double 's'

      // Or compute relative path:
      // const relFromRoot = path.relative(process.cwd(), absPath);
      res.status(201).json({
        ok: true,
        type,
        path: publicPath,   // store this in DB
        filename,
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

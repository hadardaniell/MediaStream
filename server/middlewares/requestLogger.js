// middlewares/requestLogger.js
import { logger } from '../utils/logger.js';
import { ObjectId } from 'mongodb';

export function requestLogger(req, res, next) {
  const method = req.method?.toUpperCase?.() || 'GET';
  const path = req.originalUrl || req.url || '';

  // Only log API mutations
  const MUTATING = ['POST', 'PATCH', 'DELETE'];
  if (!path.startsWith('/api/') || !MUTATING.includes(method)) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    // Prefer req.user._id (already ObjectId). If not present, convert session string to ObjectId.
    let userId;
    if (req?.user?._id) {
      userId = req.user._id; // ObjectId
    } else if (req?.session?.userId && ObjectId.isValid(String(req.session.userId))) {
      userId = new ObjectId(String(req.session.userId));
    }

    // Build doc and OMIT userId if we don't have a valid ObjectId.
    const doc = {
      method,
      path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    };
    if (userId) doc.userId = userId;

    logger.info('API mutation', doc);
  });

  next();
}

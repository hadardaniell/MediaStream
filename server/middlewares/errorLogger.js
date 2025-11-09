// middlewares/errorLogger.js
import { logger } from '../utils/logger.js';

export function errorLogger(err, req, res, next) {
  logger.error('Unhandled error', {
    method: req.method,
    path: req.originalUrl || req.url,
    userId: req?.session?.user?._id,
    error: err
  });
  next(err);
}

// utils/logger.js
import { LogsModel } from '../models/logsModel.js';

const LOG_TTL_DAYS = Number(process.env.LOG_TTL_DAYS || 0); // 0 = no TTL

function build(level, message, ctx = {}) {
  const now = new Date();
  const doc = {
    level,
    message: String(message),
    timestamp: now
  };

  // request context (only if present)
  if (ctx.method) doc.method = ctx.method;
  if (ctx.path) doc.path = ctx.path;
  if (Number.isInteger(ctx.statusCode)) doc.statusCode = ctx.statusCode;
  if (Number.isInteger(ctx.durationMs)) doc.durationMs = ctx.durationMs;

  // optional user
  if (ctx.userId) doc.userId = ctx.userId;

  // errors
  if (ctx.error?.stack) doc.stack = String(ctx.error.stack);

  // optional TTL
  if (LOG_TTL_DAYS > 0) {
    doc.expireAt = new Date(now.getTime() + LOG_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  return doc;
}

async function write(level, message, ctx) {
  try {
    await LogsModel.insert(build(level, message, ctx));
  } catch (e) {
    // do not crash if logging fails
    // eslint-disable-next-line no-console
    console.error('[log failed]', e?.message || e);
  }
}

export const logger = {
  info:  (msg, ctx) => write('info', msg, ctx),
  warn:  (msg, ctx) => write('warn', msg, ctx),
  error: (msg, ctx) => write('error', msg, ctx)
};

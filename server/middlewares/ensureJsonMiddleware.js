export function ensureJson(req, res, next) {
  // Enforce JSON only for methods that send a body
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
  }
  next();
}

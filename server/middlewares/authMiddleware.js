export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only Admin can access' });
  }
  next();
};

export const requireSelfOrAdmin = (param = 'id') => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    if (String(req.user._id) === String(req.params[param])) return next();
    return res.status(403).json({ error: 'Forbidden' });
};
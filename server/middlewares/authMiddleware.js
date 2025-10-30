// tolerant helper: works for roles: "admin" OR role: "admin" OR roles: ["admin"]
const hasAdminRole = (user) => {
  if (!user) return false;
  const r = user.roles ?? user.role;
  if (Array.isArray(r)) return r.includes('admin');
  return r === 'admin';
};

export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasAdminRole(req.user)) return res.status(403).json({ error: 'Only Admin can access' });
  next();
};

export const requireSelfOrAdmin = (param = 'id') => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (hasAdminRole(req.user)) return next();
  if (String(req.user._id) === String(req.params[param])) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

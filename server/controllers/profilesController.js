// controllers/profilesController.js
import { ObjectId } from 'mongodb';
import { ProfilesModel } from '../models/profilesModel.js';

const ALLOWED_FIELDS = ['name', 'photo'];
const pick = (obj, allowed) =>
  Object.fromEntries(Object.entries(obj ?? {}).filter(([k]) => allowed.includes(k)));

const isObjectId = (v) => {
  try { return !!new ObjectId(String(v)); } catch { return false; }
};

const isAdmin = (req) => req.user?.roles?.includes?.('admin');

// GET /api/profiles
// - Admin: all profiles (optional ?userId= filter)
// - User: only own profiles
export async function listProfiles(req, res) {
  try {
    const sort = { createdAt: -1 };
    if (isAdmin(req)) {
      const filter = {};
      if (req.query.userId && isObjectId(req.query.userId)) {
        filter.userId = new ObjectId(String(req.query.userId));
      }
      const items = await ProfilesModel.getAll(filter, sort);
      return res.json(items);
    } else {
      const userId = req.user?._id;
      const items = await ProfilesModel.getByUserId(userId, sort);
      return res.json(items);
    }
  } catch (err) {
    console.error('listProfiles error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}

// GET /api/profiles/:id
// - Owner or Admin
export async function getProfile(req, res) {
  try {
    const profile = await ProfilesModel.getById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'not_found' });

    const isOwner = String(profile.userId) === String(req.user?._id);
    if (!isOwner && !isAdmin(req)) return res.status(403).json({ error: 'forbidden' });

    res.json(profile);
  } catch (err) {
    console.error('getProfile error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}

// POST /api/profiles
// - Regular user: creates ONLY for self (userId forced to req.user._id)
// - Admin: may pass body.userId to create for someone else (falls back to self if omitted)
export async function createProfile(req, res) {
  try {
    const body = pick(req.body, ALLOWED_FIELDS);
    if (!body.name || !body.photo) {
      return res.status(400).json({ error: 'missing_required_fields', required: ['name', 'photo'] });
    }

    let userId = req.user?._id;
    if (isAdmin(req) && req.body.userId && isObjectId(req.body.userId)) {
      userId = req.body.userId; // admin override
    }

    const doc = {
      userId: new ObjectId(String(userId)),
      name: String(body.name),
      photo: String(body.photo),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await ProfilesModel.create(doc);
    res.status(201).json(created);
  } catch (err) {
    // handle duplicate key (e.g., unique (userId, name) index)
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'duplicate_profile_name_for_user' });
    }
    console.error('createProfile error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}

// PATCH /api/profiles/:id
// - Owner or Admin; can update { name, photo }
export async function updateProfile(req, res) {
  try {
    const updates = pick(req.body, ALLOWED_FIELDS);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'no_updates' });
    }

    const profile = await ProfilesModel.getById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'not_found' });

    const isOwner = String(profile.userId) === String(req.user?._id);
    if (!isOwner && !isAdmin(req)) return res.status(403).json({ error: 'forbidden' });

    updates.updatedAt = new Date();
    const saved = await ProfilesModel.updateById(req.params.id, updates);
    res.json(saved);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'duplicate_profile_name_for_user' });
    }
    console.error('updateProfile error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}

// DELETE /api/profiles/:id
// - Owner or Admin
export async function deleteProfile(req, res) {
  try {
    const profile = await ProfilesModel.getById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'not_found' });

    const isOwner = String(profile.userId) === String(req.user?._id);
    if (!isOwner && !isAdmin(req)) return res.status(403).json({ error: 'forbidden' });

    const ok = await ProfilesModel.deleteById(req.params.id);
    res.json({ ok });
  } catch (err) {
    console.error('deleteProfile error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}

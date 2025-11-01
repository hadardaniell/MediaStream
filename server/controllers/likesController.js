// controllers/likesController.js
import { LikesModel } from '../models/likesModel.js';
import { ObjectId } from 'mongodb';
import {getDb} from '../db.js';

const toInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

// helper: recompute a single content's likes from Likes (uses your countByContent)
async function recountOneContentLikes(db, contentId) {
  const count = await LikesModel.countByContent(contentId);
  await db.collection('Content').updateOne(
    { _id: new ObjectId(String(contentId)) },
    { $set: { likes: count } }
  );
  return count;
}

export const LikesController = {
  // GET /api/likes?profileId=&contentId=&limit=&skip=
  async getAll(req, res) {
    try {
      const { profileId, contentId, limit, skip, sortBy = 'createdAt', order = 'desc' } = req.query;
      const filter = {};
      if (profileId) filter.profileId = new ObjectId(String(profileId));
      if (contentId) filter.contentId = new ObjectId(String(contentId));

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
      const data = await LikesModel.getAll(filter, sort, toInt(limit, 100), toInt(skip, 0));
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // GET /api/likes/content/:contentId
  async getByContent(req, res) {
    try {
      const { contentId } = req.params;
      const { limit, skip } = req.query;
      const data = await LikesModel.getByContent(contentId, { limit: toInt(limit, 100), skip: toInt(skip, 0) });
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // GET /api/likes/profile/:profileId
  async getByProfile(req, res) {
    try {
      const { profileId } = req.params;
      const { limit, skip } = req.query;
      const data = await LikesModel.getByProfile(profileId, { limit: toInt(limit, 100), skip: toInt(skip, 0) });
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // GET /api/likes/content/:contentId/count
  async countByContent(req, res) {
    try {
      const { contentId } = req.params;
      const count = await LikesModel.countByContent(contentId);
      res.json({ contentId, count });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // GET /api/likes/profile/:profileId/count
  async countByProfile(req, res) {
    try {
      const { profileId } = req.params;
      const count = await LikesModel.countByProfile(profileId);
      res.json({ profileId, count });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // POST /api/likes  { profileId, contentId }
// POST /api/likes  { profileId, contentId }
async create(req, res) {
  try {
    const { profileId, contentId } = req.body || {};
    if (!profileId || !contentId) return res.status(400).json({ error: 'profileId and contentId are required' });

    const db = await getDb();
    const session = db.client?.startSession?.();

    // Transactional path (preferred)
    if (session) {
      let insertedLikeId = null;
      await session.withTransaction(async () => {
        const ins = await db.collection('Likes').insertOne({
          profileId: new ObjectId(String(profileId)),
          contentId: new ObjectId(String(contentId)),
          createdAt: new Date()
        }, { session });
        insertedLikeId = ins.insertedId;

        const upd = await db.collection('Content').updateOne(
          { _id: new ObjectId(String(contentId)) },
          { $inc: { likes: 1 } },
          { session , bypassDocumentValidation: true}
        );
        if (upd.matchedCount !== 1) {
          throw new Error('Content not found while updating likes counter');
        }
      });
      await session.endSession();
      return res.status(201).json({
        _id: undefined, // you can omit or return insertedLikeId if you want
        profileId,
        contentId,
        createdAt: new Date()
      });
    }

    // Fallback (non-transactional, still keeps things in sync; self-heals if needed)
    const like = await LikesModel.create({ profileId, contentId });
    const upd = await db.collection('Content').updateOne(
      { _id: new ObjectId(String(contentId)) },
      { $inc: { likes: 1 } }
    );
    if (upd.matchedCount !== 1) {
      // content missing — recompute to be safe (or handle as error)
      await recountOneContentLikes(db, contentId);
    }
    return res.status(201).json(like);

  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: 'Already liked by this profile' });
    }
    res.status(400).json({ error: e.message });
  }
},

  // DELETE /api/likes/:id     (optional path)
  async removeById(req, res) {
    try {
      const { id } = req.params;
      const r = await LikesModel.removeById(id);
      if (r.deletedCount === 0) return res.status(404).json({ error: 'Like not found' });
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // DELETE /api/likes         body: { profileId, contentId }  (idempotent unlike)
// DELETE /api/likes   body: { profileId, contentId }  (idempotent unlike)
async removeByPair(req, res) {
  try {
    const { profileId, contentId } = req.body || {};
    if (!profileId || !contentId) return res.status(400).json({ error: 'profileId and contentId are required' });

    const db = await getDb();
    const session = db.client?.startSession?.();

    // Transactional path
    if (session) {
      let actuallyDeleted = 0;
      await session.withTransaction(async () => {
        const del = await db.collection('Likes').deleteOne({
          profileId: new ObjectId(String(profileId)),
          contentId: new ObjectId(String(contentId))
        }, { session });

        actuallyDeleted = del.deletedCount || 0;

        if (actuallyDeleted === 1) {
          const upd = await db.collection('Content').updateOne(
            { _id: new ObjectId(String(contentId)) },
            { $inc: { likes: -1 } },
            { session , bypassDocumentValidation: true}
          );
          if (upd.matchedCount !== 1) {
            throw new Error('Content not found while decrementing likes counter');
          }

          // safety: ensure non-negative; if weird, self-heal using countByContent
          const doc = await db.collection('Content').findOne(
            { _id: new ObjectId(String(contentId)) },
            { session, projection: { likes: 1 } }
          );
          if ((doc?.likes ?? 0) < 0) {
            await recountOneContentLikes(db, contentId);
          }
        }
      });
      await session.endSession();
      return res.json({ ok: true, deleted: actuallyDeleted });
    }

    // Fallback (non-transactional)
    const r = await LikesModel.removeByPair({ profileId, contentId });
    if ((r.deletedCount || 0) === 1) {
      const upd = await db.collection('Content').updateOne(
        { _id: new ObjectId(String(contentId)) },
        { $inc: { likes: -1 } }
      );
      if (upd.matchedCount !== 1) {
        await recountOneContentLikes(db, contentId);
      }
      // extra safety
      const doc = await db.collection('Content').findOne(
        { _id: new ObjectId(String(contentId)) },
        { projection: { likes: 1 } }
      );
      if ((doc?.likes ?? 0) < 0) {
        await recountOneContentLikes(db, contentId);
      }
    }
    // idempotent OK
    return res.json({ ok: true, deleted: r.deletedCount || 0 });

  } catch (e) {
    res.status(400).json({ error: e.message });
  }
},


async removeAllByProfile(req, res) {
  try {
    const { profileId } = req.params;
    const db = await getDb();
    const session = db.client?.startSession?.();

    // Transactional path
    if (session) {
      let deleted = 0;
      await session.withTransaction(async () => {
        // group counts by content so we decrement accurately
        const liked = await db.collection('Likes').aggregate([
          { $match: { profileId: new ObjectId(String(profileId)) } },
          { $group: { _id: '$contentId', n: { $sum: 1 } } }
        ], { session }).toArray();

        if (liked.length === 0) {
          deleted = 0;
          return;
        }

        const del = await db.collection('Likes').deleteMany(
          { profileId: new ObjectId(String(profileId)) },
          { session }
        );
        deleted = del.deletedCount || 0;

        const bulk = db.collection('Content').initializeUnorderedBulkOp({ session });
        for (const { _id: cid, n } of liked) {
          bulk.find({ _id: cid }).updateOne({ $inc: { likes: -n } });
        }
        if (liked.length) await bulk.execute();
      });
      await session.endSession();
      return res.json({ deleted });
    }

    // Fallback (non-transactional)
    const liked = await db.collection('Likes').aggregate([
      { $match: { profileId: new ObjectId(String(profileId)) } },
      { $group: { _id: '$contentId', n: { $sum: 1 } } }
    ]).toArray();

    const del = await db.collection('Likes').deleteMany({ profileId: new ObjectId(String(profileId)) });
    const deleted = del.deletedCount || 0;

    if (deleted > 0) {
      const bulk = db.collection('Content').initializeUnorderedBulkOp();
      for (const { _id: cid, n } of liked) {
        bulk.find({ _id: cid }).updateOne({ $inc: { likes: -n } });
      }
      await bulk.execute();
    }

    return res.json({ deleted });

  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

};

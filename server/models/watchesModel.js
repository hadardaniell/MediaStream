// models/watchesModel.js
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

export const WatchesModel = {
  async getByProfile(profileId, { status } = {}) {
    const db = await getDb();
    const q = { profileId: new ObjectId(String(profileId)) };
    if (status) q.status = status; // 'in_progress' | 'completed'
    return db.collection('watches')
      .find(q)
      .sort({ updatedAt: -1 })
      .toArray();
  },

  async getOne(profileId, contentId) {
    const db = await getDb();
    return db.collection('watches').findOne({
      profileId: new ObjectId(String(profileId)),
      contentId: new ObjectId(String(contentId)),
    });
  },

  // Start/continue watching (idempotent upsert)
  async upsertProgress({ profileId, contentId, progressSeconds = 0, seasonNumber, episodeNumber }) {
    const db = await getDb();
    const now = new Date();

    const update = {
      $setOnInsert: { createdAt: now },
      $set: {
        status: 'in_progress',
        progressSeconds,
        updatedAt: now,
      },
    };

    if (seasonNumber != null) update.$set.seasonNumber = seasonNumber;
    if (episodeNumber != null) update.$set.episodeNumber = episodeNumber;

    return db.collection('watches').updateOne(
      { profileId: new ObjectId(String(profileId)), contentId: new ObjectId(String(contentId)) },
      update,
      { upsert: true }
    );
  },

  // Mark as completed (keeps last position if any)
  async markCompleted({ profileId, contentId }) {
    const db = await getDb();
    const now = new Date();
    return db.collection('watches').updateOne(
      { profileId: new ObjectId(String(profileId)), contentId: new ObjectId(String(contentId)) },
      { $set: { status: 'completed', updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
  },

  // Optional: delete → treat as "not watched"
  async remove(profileId, contentId) {
    const db = await getDb();
    return db.collection('watches').deleteOne({
      profileId: new ObjectId(String(profileId)),
      contentId: new ObjectId(String(contentId)),
    });
  },

  // With joined Content for building the feed in one call
  async getByProfileWithContent(profileId, { status } = {}) {
    const db = await getDb();
    const pipeline = [
      { $match: { profileId: new ObjectId(String(profileId)), ...(status ? { status } : {}) } },
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: 'Content',
          localField: 'contentId',
          foreignField: '_id',
          as: 'content'
        }
      },
      { $unwind: '$content' }
    ];
    return db.collection('watches').aggregate(pipeline).toArray();
  },

  // Admin: list all with pagination/filters
  async listAll({ status, profileId, contentId, limit = 50, cursor }) {
    const db = await getDb();
    const col = db.collection('watches');

    const q = {};
    if (status) q.status = status;
    if (profileId) q.profileId = new ObjectId(String(profileId));
    if (contentId) q.contentId = new ObjectId(String(contentId));

    const sort = { updatedAt: -1, _id: -1 };

    if (cursor) {
      const [ts, id] = cursor.split('_'); // cursor = `${updatedAtIso}_${_id}`
      q.$or = [
        { updatedAt: { $lt: new Date(ts) } },
        { updatedAt: new Date(ts), _id: { $lt: new ObjectId(id) } }
      ];
    }

    const docs = await col.find(q).sort(sort).limit(Number(limit)).toArray();
    const nextCursor =
      docs.length === Number(limit)
        ? `${docs[docs.length - 1].updatedAt.toISOString()}_${docs[docs.length - 1]._id}`
        : null;

    return { items: docs, nextCursor };
  }
};

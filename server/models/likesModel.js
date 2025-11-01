import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const asObjectId = (v) => new ObjectId(String(v));

export const LikesModel = {
  async getAll(filter = {}, sort = {}, limit = 100, skip = 0) {
    const db = await getDb();
    return db.collection('Likes')
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  },

  async getByContent(contentId, { limit = 100, skip = 0 } = {}) {
    const db = await getDb();
    return db.collection('Likes')
      .find({ contentId: asObjectId(contentId) })
      .skip(skip).limit(limit).toArray();
  },

  async getByProfile(profileId, { limit = 100, skip = 0 } = {}) {
    const db = await getDb();
    return db.collection('Likes')
      .find({ profileId: asObjectId(profileId) })
      .skip(skip).limit(limit).toArray();
  },

  async countByContent(contentId) {
    const db = await getDb();
    return db.collection('Likes').countDocuments({ contentId: asObjectId(contentId) });
  },

  async countByProfile(profileId) {
    const db = await getDb();
    return db.collection('Likes').countDocuments({ profileId: asObjectId(profileId) });
  },

  async create({ profileId, contentId }) {
    const db = await getDb();
    const doc = {
      profileId: asObjectId(profileId),
      contentId: asObjectId(contentId),
      createdAt: new Date()
    };
    const res = await db.collection('Likes').insertOne(doc);
    return { _id: res.insertedId, ...doc };
  },

  // delete by _id (optional)
  async removeById(id) {
    const db = await getDb();
    return db.collection('Likes').deleteOne({ _id: asObjectId(id) });
  },

  // idempotent “unlike”: delete by (profileId, contentId)
  async removeByPair({ profileId, contentId }) {
    const db = await getDb();
    return db.collection('Likes').deleteOne({
      profileId: asObjectId(profileId),
      contentId: asObjectId(contentId)
    });
  },
  async removeAllByProfile({profileId})
  {
     const db = await getDb;
     return db.collection('Likes').deleteMany({
        profileId: new ObjectId(String(profileId))
     });
  }
};

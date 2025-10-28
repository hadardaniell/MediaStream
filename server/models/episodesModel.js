import { getDb } from '../db.js';
import { ObjectId, Int32 } from 'mongodb';

export const EpisodesModel = {
  async listByContent(contentId, { season, sort = { seasonNumber: 1, episodeNumber: 1 } } = {}) {
    const db = await getDb();
    const q = { contentId: new ObjectId(String(contentId)) };
    if (season != null) q.seasonNumber = new Int32(Number(season));
    return db.collection('Episodes').find(q).sort(sort).toArray();
  },

  async create({ contentId, seasonNumber, episodeNumber, shortDescription, video }) {
    const db = await getDb();
    const now = new Date();
    const doc = {
      contentId: new ObjectId(String(contentId)),
      seasonNumber: new Int32(Number(seasonNumber)),
      episodeNumber: new Int32(Number(episodeNumber)),
      shortDescription: String(shortDescription),
      video: String(video),
      createdAt: now,
      updatedAt: now
    };
    const { insertedId } = await db.collection('Episodes').insertOne(doc);
    return db.collection('Episodes').findOne({ _id: insertedId });
  },

  async updateById(id, patch) {
    const db = await getDb();
    const $set = { updatedAt: new Date() };
    if (patch.shortDescription != null) $set.shortDescription = String(patch.shortDescription);
    if (patch.video != null) $set.video = String(patch.video);

    const res = await db.collection('Episodes').updateOne(
      { _id: new ObjectId(String(id)) },
      { $set }
    );
    if (!res.matchedCount) return null;
    return db.collection('Episodes').findOne({ _id: new ObjectId(String(id)) });
  },

  async deleteById(id) {
    const db = await getDb();
    const r = await db.collection('Episodes').deleteOne({ _id: new ObjectId(String(id)) });
    return r.deletedCount === 1;
  },

  async deleteByContent(contentId) {
    const db = await getDb();
    await db.collection('Episodes').deleteMany({ contentId: new ObjectId(String(contentId)) });
  },

  async countByContent(contentId) {
    const db = await getDb();
    return db.collection('Episodes').countDocuments({ contentId: new ObjectId(String(contentId)) });
  }
};

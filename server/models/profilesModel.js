// models/profilesModel.js
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

export const ProfilesModel = {
  async getAll(filter = {}, sort = {}) {
    const db = await getDb();
    return db.collection('Profiles').find(filter).sort(sort).toArray();
  },

  async getById(id) {
    const db = await getDb();
    return db.collection('Profiles').findOne({ _id: new ObjectId(String(id)) });
  },

  async getByUserId(userId, sort = {}) {
    const db = await getDb();
    return db.collection('Profiles')
      .find({ userId: new ObjectId(String(userId)) })
      .sort(sort)
      .toArray();
  },

  async create(doc) {
    const db = await getDb();
    const res = await db.collection('Profiles').insertOne(doc);
    return { _id: res.insertedId, ...doc };
  },

  async updateById(id, updates) {
    const db = await getDb();
    const res = await db.collection('Profiles').findOneAndUpdate(
      { _id: new ObjectId(String(id)) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return res.value;
  },

  async deleteById(id) {
    const db = await getDb();
    const res = await db.collection('Profiles').deleteOne({ _id: new ObjectId(String(id)) });
    return res.deletedCount === 1;
  }
};

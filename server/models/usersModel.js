// models/usersModel.js
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

export const UsersModel = {
  // getAll with filter & sort
  async getAll(filter = {}, sort = {}) {
    const db = await getDb();
    return db.collection('Users').find(filter).sort(sort).toArray();
  },

  // get one user by ID
  async getById(id) {
    const db = await getDb();
    return db.collection('Users').findOne({ _id: new ObjectId(String(id)) });
  },

  // get one user by email (exact match)
  async getByEmail(email) {
    const db = await getDb();
    return db.collection('Users').findOne({ email });
  },

  // create a new user document
  async create(doc) {
    const db = await getDb();
    const now = new Date();
    const payload = { ...doc, createdAt: doc.createdAt ?? now, updatedAt: now };
    const { insertedId } = await db.collection('Users').insertOne(payload);
    return this.getById(insertedId.toString());
  },

  // partial update
  async updateById(id, update) {
    const db = await getDb();
    const res = await db.collection('Users').updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { ...update, updatedAt: new Date() } }
    );
    if (res.matchedCount === 0) return null;
    return this.getById(id);
  },

  // delete one by ID
  async deleteById(id) {
    const db = await getDb();
    const res = await db.collection('Users').deleteOne({ _id: new ObjectId(String(id)) });
    return res.deletedCount === 1;
  }
};

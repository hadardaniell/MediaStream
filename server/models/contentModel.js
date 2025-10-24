import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

export const ContentModel = {
    
  // ✅ Get all (with optional filters)
  async getAll(filter = {}, sort = {}) {
    const db = await getDb();
    return db.collection('Content').find(filter).sort(sort).toArray();
  },

  // ✅ Get one by ID
  async getById(id) {
    const db = await getDb();
    return db.collection('Content').findOne({ _id: new ObjectId(id) });
  },
};

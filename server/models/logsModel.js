// models/logsModel.js
import { getDb } from '../db.js';

export const LogsModel = {
  async insert(doc) {
    const db = await getDb();
    return db.collection('Logs').insertOne(doc);
  }
};

import { getDb } from '../db.js';
import { Int32, ObjectId } from 'mongodb';

export const ContentModel = {
    
//getAll with filter & Sort
  async getAll(filter = {}, sort = {}) {
    const db = await getDb();

    return db.collection('Content').find(filter).sort(sort).toArray();
  },

  // get one content by ID 
  async getById(id) {
    const db = await getDb();

    return db.collection('Content').findOne( { _id: new ObjectId(String(id)) } );
  },

  //create a new content document
  async create(doc)
  {
    const db = await getDb();
    const {insertedId} = await db.collection('Content').insertOne(doc);

    return this.getById(insertedId.toString());
  },

  //Partial Update
  async updateById(id,update)
  {
    const db = await getDb();
    const res = await db.collection('Content').updateOne({_id: new ObjectId(String(id))} , { $set: update})
    if (res.matchedCount === 0) return null;

    return this.getById(id);
  },

  //Delete one by ID 
  async deleteById(id)
  {
    const db = await getDb();
    const res = await db.collection('Content').deleteOne( { _id: new ObjectId(String(id))});

    return res.deletedCount === 1;
  }

};

import { getDb } from '../db.js';
import { Int32, ObjectId } from 'mongodb';

export const ContentModel = {
    
//getAll with filter & Sort
  async getAll(filter = {}, sort = {}) {
    const db = await getDb();

    return db.collection('Content').find(filter).sort(sort).toArray();
  },

  //getPopular Function
    async getPopular({
    mode = 'likes',
    limit = 10,
    type,
    genres,
    minRating = 0,
    wLikes = 1,
    wRating = 1
  } = {}) {
    const db = await getDb();

    // Optional filters on Content
    const match = {};
    if (type) match.type = type;
    if (Array.isArray(genres) && genres.length) match.genres = { $in: genres };
    if (typeof minRating === 'number') match.rating = { $gte: minRating };

    const pipeline = [
      { $match: match },
      {
        // GROUP BY Likes.contentId and return a count per content
        $lookup: {
          from: 'Likes', // ⚠️ collection name as you use elsewhere
          let: { cid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$contentId', '$$cid'] } } },
            { $group: { _id: null, count: { $sum: 1 } } }
          ],
          as: 'likesAgg'
        }
      },
      {
        $addFields: {
          likesCount: { $ifNull: [{ $arrayElemAt: ['$likesAgg.count', 0] }, 0] },
          safeRating: { $ifNull: ['$rating', 0] }
        }
      },
      { $project: { likesAgg: 0 } }
    ];

    if (mode === 'likes') {
      pipeline.push({ $sort: { likesCount: -1, safeRating: -1, _id: 1 } });
    } else if (mode === 'rating') {
      pipeline.push({ $sort: { safeRating: -1, likesCount: -1, _id: 1 } });
    } else if (mode === 'mixed') {
      pipeline.push({
        $addFields: {
          popScore: {
            $add: [
              { $multiply: ['$likesCount', Number(wLikes) || 1] },
              { $multiply: ['$safeRating', Number(wRating) || 1] }
            ]
          }
        }
      });
      pipeline.push({ $sort: { popScore: -1, likesCount: -1, safeRating: -1, _id: 1 } });
    } else {
      // default
      pipeline.push({ $sort: { likesCount: -1, safeRating: -1, _id: 1 } });
    }

    pipeline.push({ $limit: Math.max(1, Number(limit) || 10) });

    pipeline.push({
      $project: {
        name: 1,
        type: 1,
        genres: 1,
        year: 1,
        description: 1,
        photo: 1,
        rating: '$safeRating',
        likesCount: 1,
        ...(mode === 'mixed' ? { popScore: 1 } : {})
      }
    });

    return db.collection('Content').aggregate(pipeline).toArray();
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

// Delete with Cascade
async deleteCascadeById(id) {
  const db = await getDb();
  const cid = new ObjectId(String(id));

  // 1) Delete the content itself
  const res = await db.collection('Content').deleteOne({ _id: cid });
  if (res.deletedCount !== 1) {
    return { deleted: false, episodesDeleted: 0, likesDeleted: 0, watchesDeleted: 0 };
  }

  // 2) Best-effort cascade
  const [episodes, likes, watchesLower, watchesUpper] = await Promise.all([
    db.collection('Episodes').deleteMany({ contentId: cid }).catch(() => ({ deletedCount: 0 })),
    db.collection('Likes').deleteMany({ contentId: cid }).catch(() => ({ deletedCount: 0 })),
    db.collection('watches').deleteMany({ contentId: cid }).catch(() => ({ deletedCount: 0 })),
    db.collection('Watches').deleteMany({ contentId: cid }).catch(() => ({ deletedCount: 0 })),
  ]);

  const watchesDeleted = (watchesLower?.deletedCount || 0) + (watchesUpper?.deletedCount || 0);

  return {
    deleted: true,
    episodesDeleted: episodes?.deletedCount ?? 0,
    likesDeleted: likes?.deletedCount ?? 0,
    watchesDeleted
  };
},

  //Delete one by ID 
  async deleteById(id)
  {
    const db = await getDb();
    const res = await db.collection('Content').deleteOne( { _id: new ObjectId(String(id))});

    return res.deletedCount === 1;
  }

};

// server/scripts/recountLikes.js
import 'dotenv/config';
import { ObjectId, Int32 } from 'mongodb';    // ← add Int32
import { getDb } from '../db.js';
import { LikesModel } from '../models/likesModel.js';

const args = new Map(process.argv.slice(2).map(a => {
  const [k, v = true] = a.startsWith('--') ? a.slice(2).split('=') : [a, true];
  return [k, v];
}));
const DRY = !!args.get('dry-run');
const ONE_ID = args.get('content') || args.get('id') || null;

(async function main() {
  try {
    const db = await getDb();

    const updateOneContent = async (contentId) => {
      const _id = new ObjectId(String(contentId));
      const raw = await LikesModel.countByContent(_id);
      const count = Math.max(0, Number(raw) || 0);      // sanitize
      if (DRY) {
        console.log(`[dry-run] Would set Content ${_id} -> likes=${count}`);
      } else {
        await db.collection('Content').updateOne(
          { _id },
          { $set: { likes: new Int32(count) } },
          { bypassDocumentValidation: true }         // ← ensure int, not double
        );
        console.log(`[recount] Updated Content ${_id} -> likes=${count}`);
      }
    };

    if (ONE_ID) {
      await updateOneContent(ONE_ID);
    } else {
      const cursor = db.collection('Content').find({}, { projection: { _id: 1 } });
      while (await cursor.hasNext()) {
        const { _id } = await cursor.next();
        await updateOneContent(_id);
      }
      await cursor.close();
    }

    console.log(DRY ? '[done] Dry run complete.' : '[done] All contents updated.');
    process.exit(0);
  } catch (err) {
    console.error('[recount] ERROR', err);
    process.exit(1);
  }
})();

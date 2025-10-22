import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDb } from './db.js';
import router from './router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

 // הגשת קבצי הלקוח
 app.use('/client', express.static(path.join(__dirname, '../client')));
 
 app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
 });

const testConnection = async () => {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("❌ Mongo connection error:", err);
  }
};

testConnection();

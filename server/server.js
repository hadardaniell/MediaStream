import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDb } from './db.js';
import router from './router.js';
import contentRoutes from  './routes/contentRoute.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

 // הגשת קבצי הלקוח
 app.use(cors());
 app.use(express.json());
 app.use(express.urlencoded( { extended: true}));
 app.use('/client', express.static(path.join(__dirname, '../client')));
 app.use('/', router);
 app.use('/api/content',contentRoutes);
 
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

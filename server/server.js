import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDb } from './db.js';
import router from './router.js';
import contentRoutes from  './routes/contentRoute.js'
import session from 'express-session';
import {UsersModel} from './models/usersModel.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

 // הגשת קבצי הלקוח
  app.use(session({
   name: 'sid',
   secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
   resave: false,
   saveUninitialized: false,
   cookie: {
     httpOnly: true,
     sameSite: 'lax',
     secure: false,
     maxAge: 100*60*60*24 // 1 day
   }
 }));
 app.use(cors());
 app.use(express.json());
 app.use(express.urlencoded( { extended: true}));
 app.use('/client', express.static(path.join(__dirname, '../client')));
 app.use('/', router);
 app.use('/api/content',contentRoutes);
 app.use('/api/auth', authRoutes);

app.use(async (req, _res, next) => {
  if (req.session?.userId) {
    try {req.user = await UsersModel.getById(req.session.userId);} catch{}
  }
  next();
});
 
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

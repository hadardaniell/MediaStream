import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDb } from './db.js';
import router from './router.js';
import contentRoutes from './routes/contentRoutes.js';
import session from 'express-session';
import { UsersModel } from './models/usersModel.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import episodesRoutes from './routes/episodesRoutes.js';
import profileRoutes from './routes/profilesRoutes.js';
import likesRoutes from './routes/likesRoutes.js';
import watchesRoutes from './routes/watchesRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Session Middleware
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',  // if cross-origin, use 'none' + secure:true
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Cors and Body Parser
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // if frontend separate
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Require User for protected routes
app.use(async (req, _res, next) => {
  if (req.session?.userId) {
    try { req.user = await UsersModel.getById(req.session.userId); } catch {}
  }
  next();
});

// Routes
app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/', router);
app.use('/api/content', contentRoutes);
app.use('/api', episodesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/watches', watchesRoutes)

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// (optional) test DB connection
const testConnection = async () => {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ Mongo connection error:', err);
  }
};
testConnection();

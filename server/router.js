import express from 'express';
import path from 'path';

const router = express.Router();


router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/login/login.html'));
});

router.get('/profiles', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/profiles-page/profiles-page.html'));
});

router.get('/feed', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/feed/feed.html'));
});

router.get('/watch', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/feed/feed.html'));
});

router.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/search-media/search-media.html'));
});

export default router;

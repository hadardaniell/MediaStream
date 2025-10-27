import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

router.get('/media-content/:id', (req, res) => {
  // const { id } = req.params;
  // // const content = contents.find(c => c.id === id);

  // if (!content) {
  //   return res.status(404).json({ error: "Content not found" });
  // }

  // res.json(content);

   res.sendFile(path.join(__dirname, '../client/components/media-content/media-content.html'));
});

router.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/media-player/media-player.html'));
});

router.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/settings/edit-profile/edit-profile.html'));
});

router.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/settings/manage-account/manage-account.html'));
});

router.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/settings/manage-profiles/manage-profiles.html'));
});

router.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/settings/statistics/statistics.html'));
});


export default router;

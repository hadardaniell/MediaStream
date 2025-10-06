const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/login/login.html'));
});

router.get('/profiles', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/profiles/profiles.html'));
});

router.get('/feed', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/components/feed/feed.html'));
});

module.exports = router;
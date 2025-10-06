const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// הגשת קבצי הלקוח
app.use('/client', express.static(path.join(__dirname, '../client')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const router = require('./router');
app.use('/', router);
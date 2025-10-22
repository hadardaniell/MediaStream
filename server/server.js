const express = require('express');
const path = require('path');
const app = express();
const { getDb } = require("./db")
const PORT = 3000;
 
 // הגשת קבצי הלקוח
 app.use('/client', express.static(path.join(__dirname, '../client')));
 
 app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
 });
 
 const router = require('./router');
 app.use('/', router);

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

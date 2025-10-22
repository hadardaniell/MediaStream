import { getDb } from './db.js';

const testConnection = async () => {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    console.log("✅ Connected to MongoDB");
    console.log("Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("❌ Mongo connection error:", err);
  } finally {
    process.exit(); // Close the process when done
  }
};

testConnection();
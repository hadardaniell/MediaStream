import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

export async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db("DisneyPlusDB"); // name of your database
    console.log("Connected to MongoDB Atlas - Great Success!");
  }
  return db;
}

import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("ultron-db"); // database name
    console.log("[Ultron DB] Connected to MongoDB");
  }
  return db;
}
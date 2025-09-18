import { connectDB } from "../utils/db.js";
import { toObjectId } from '../utils/dbUtils.js'

export async function saveSessionToDB(
  conversationHistory,
  source = "unknown",
  title = null
) {
  if (!conversationHistory.length) return;

  const db = await connectDB();
  const session = {
    title: title || `Session ${new Date().toLocaleString()}`,
    date: new Date(),
    source,
    messages: conversationHistory,
  };

  const result = await db.collection("sessions").insertOne(session);
  return result.insertedId;
}

export async function listSessions() {
  const db = await connectDB();
  return db.collection("sessions").find({}).sort({date: -1}).toArray()
}

export async function getSession(id) {
  console.log('id', id)
  const db = await connectDB();
  return db.collection("sessions").findOne({_id: toObjectId(id)})
}

export async function deleteSession(id) {
  const db = await connectDB();
  return db.collection("sessions").deleteOne({ _id: toObjectId(id) });
}
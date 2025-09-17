import { connectDB } from "../utils/db.js";

export async function saveSessionToDB(conversationHistory) {
  if (!conversationHistory.length) return;

  const db = await connectDB();
  const session = {
    title: `Session ${new Date().toLocaleString()}`,
    date: new Date(),
    messages: conversationHistory,
  };

  await db.collection("sessions").insertOne(session);
}
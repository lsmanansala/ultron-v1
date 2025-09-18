import { connectDB } from "../../api/utils/db.js";

/**
 * Save a new Ragnarok account
 * @param {string} username
 * @param {string} description
 * @param {string} purpose - gold farmer, utility, pvp, woe, ET, etc.
 */
export async function addAccount(username, description, purpose) {
  const db = await connectDB();
  const account = {
    username,
    description,
    purpose,
    createdAt: new Date(),
  };
  const result = await db.collection("ragnarok_accounts").insertOne(account);
  return result.insertedId;
}

/**
 * List all accounts
 */
export async function listAccounts() {
  const db = await connectDB();
  return db
    .collection("ragnarok_accounts")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Find one account by ID
 */
import { ObjectId } from "mongodb";
export async function getAccount(id) {
  const db = await connectDB();
  return db.collection("ragnarok_accounts").findOne({ _id: new ObjectId(id) });
}

/**
 * Update account
 */
export async function updateAccount(id, updates) {
  const db = await connectDB();
  const result = await db
    .collection("ragnarok_accounts")
    .updateOne({ _id: new ObjectId(id) }, { $set: updates });
  return result.modifiedCount > 0;
}

/**
 * Delete account
 */
export async function deleteAccount(id) {
  const db = await connectDB();
  const result = await db
    .collection("ragnarok_accounts")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

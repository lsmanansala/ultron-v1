// modules/ragnarok/crafting.js
import { connectDB } from "../../api/utils/db.js";
import { ObjectId } from "mongodb";

/**
 * Add a new craftable item
 * @param {string} itemName - The item you want to craft
 * @param {Array<{ name: string, required: number, owned: number }>} requirements
 */
export async function addCraft(itemName, requirements = []) {
  const db = await connectDB();
  const craft = {
    itemName,
    requirements,
    createdAt: new Date(),
  };
  const result = await db.collection("ragnarok_crafting").insertOne(craft);
  return result.insertedId;
}

/**
 * List all crafts
 */
export async function listCrafts() {
  const db = await connectDB();
  return db.collection("ragnarok_crafting").find({}).sort({ createdAt: -1 }).toArray();
}

/**
 * Get a single craft by ID
 */
export async function getCraft(id) {
  const db = await connectDB();
  return db.collection("ragnarok_crafting").findOne({ _id: new ObjectId(id) });
}

/**
 * Update requirements (owned amounts, etc.)
 */
export async function updateCraft(id, updates) {
  const db = await connectDB();
  const result = await db.collection("ragnarok_crafting").updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );
  return result.modifiedCount > 0;
}

/**
 * Delete a craft
 */
export async function deleteCraft(id) {
  const db = await connectDB();
  const result = await db.collection("ragnarok_crafting").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/**
 * Calculate how many items can be crafted
 */
export async function calculateCraftable(id) {
  const db = await connectDB();
  const craft = await db.collection("ragnarok_crafting").findOne({ _id: new ObjectId(id) });

  if (!craft) return null;

  // find the limiting material
  const maxCrafts = craft.requirements.reduce((min, req) => {
    const possible = Math.floor(req.owned / req.required);
    return min === null ? possible : Math.min(min, possible);
  }, null);

  return {
    itemName: craft.itemName,
    craftable: maxCrafts || 0,
    requirements: craft.requirements,
  };
}

// modules/ragnarok/income.js
import { connectDB } from "../../api/utils/db.js";
import { ObjectId } from "mongodb";

// Conversion rates (can also move to config.js later)
const GOLD_TO_ZENNY = 124000;     // 1 gold = 124,000 zeny
const CREDIT_TO_ZENNY = 10_000_000; // 1 credit = 10,000,000 zeny

/**
 * List gold farm runs filtered by date range
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export async function listGoldFarmsByDate(startDate, endDate) {
  const db = await connectDB();

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return db.collection("ragnarok_income")
    .find({ source: "Gold Farm", ...query })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Add a gold farm run entry
 * @param {string} account - the account name/ID
 * @param {number} goldEarned - how much gold was farmed
 * @param {number} hours - how many hours the run lasted
 */
export async function addGoldFarm(account, goldEarned, hours = 3) {
  const db = await connectDB();

  const zennyEquivalent = goldEarned * GOLD_TO_ZENNY;

  const entry = {
    source: "Gold Farm",
    account,
    goldEarned,
    hours,
    type: "gold",
    zennyEquivalent,
    createdAt: new Date(),
  };

  const result = await db.collection("ragnarok_income").insertOne(entry);
  return result.insertedId;
}

/**
 * Get all gold farm runs
 */
export async function listGoldFarms() {
  const db = await connectDB();
  return db.collection("ragnarok_income")
    .find({ source: "Gold Farm" })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Summarize gold farming results with optional date filter
 */
export async function summarizeGoldFarms(startDate = null, endDate = null) {
  const db = await connectDB();

  const query = { source: "Gold Farm" };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const runs = await db.collection("ragnarok_income")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  let totalGold = 0;
  let totalZenny = 0;
  let totalHours = 0;

  runs.forEach(r => {
    totalGold += r.goldEarned;
    totalZenny += r.zennyEquivalent;
    totalHours += r.hours || 0;
  });

  return {
    runs: runs.length,
    totalGold,
    totalZenny,
    totalCredits: totalZenny / CREDIT_TO_ZENNY,
    avgGoldPerHour: totalHours > 0 ? (totalGold / totalHours).toFixed(2) : 0
  };
}

/**
 * Add an income source entry
 * @param {string} source - e.g. "Gold Farm", "ET Run"
 * @param {number} amount - numeric amount
 * @param {"zenny"|"gold"|"credit"} type - unit type
 */
export async function addIncome(source, amount, type = "zenny") {
  const db = await connectDB();

  const zennyEquivalent = convertToZenny(amount, type);

  const entry = {
    source,
    amount,
    type,
    zennyEquivalent,
    createdAt: new Date(),
  };

  const result = await db.collection("ragnarok_income").insertOne(entry);
  return result.insertedId;
}

/**
 * List all income entries
 */
export async function listIncome() {
  const db = await connectDB();
  return db.collection("ragnarok_income").find({}).sort({ createdAt: -1 }).toArray();
}

/**
 * Delete an income entry
 */
export async function deleteIncome(id) {
  const db = await connectDB();
  const result = await db.collection("ragnarok_income").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/**
 * Calculate total income summary
 */
export async function getIncomeSummary() {
  console.log('went inside')
  const db = await connectDB();
  const entries = await db.collection("ragnarok_income").find({}).toArray();
  let totalZenny = 0;
  for (const e of entries) {
    totalZenny += e.zennyEquivalent || 0;
  }

  return {
    totalZenny,
    totalCredits: totalZenny / CREDIT_TO_ZENNY,
    totalGold: totalZenny / GOLD_TO_ZENNY,
    entriesCount: entries.length,
  };
}

/**
 * Get a single craft by ID
 */
export async function getIncomeDetail(id) {
  const db = await connectDB();
  return db.collection("ragnarok_income").findOne({ _id: new ObjectId(id) });
}

/**
 * Helper: Convert any income type to zenny
 */
function convertToZenny(amount, type) {
  switch (type) {
    case "gold": return amount * GOLD_TO_ZENNY;
    case "credit": return amount * CREDIT_TO_ZENNY;
    default: return amount; // zenny
  }
}

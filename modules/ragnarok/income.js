// modules/ragnarok/income.js
import { connectDB } from "../../api/utils/db.js";
import { ObjectId } from "mongodb";

// Conversion rates
const GOLD_TO_ZENNY = 124000;       // 1 gold = 124,000 zeny
const CREDIT_TO_ZENNY = 10_000_000; // 1 credit = 10,000,000 zeny

/* =============================
   GOLD FARM FUNCTIONS
   ============================= */

/**
 * List gold farm runs filtered by date range
 */
export async function listGoldFarmsByDate(startDate, endDate) {
  const db = await connectDB();

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return db.collection("ragnarok_goldfarm")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Add a gold farm run entry
 */
export async function addGoldFarm(account, goldEarned, hours = 3) {
  const db = await connectDB();

  const zennyEquivalent = goldEarned * GOLD_TO_ZENNY;

  const entry = {
    account,
    goldEarned,
    hours,
    type: "gold",
    zennyEquivalent,
    createdAt: new Date(),
  };

  const result = await db.collection("ragnarok_goldfarm").insertOne(entry);
  return result.insertedId;
}

/**
 * Get all gold farm runs
 */
export async function listGoldFarms() {
  const db = await connectDB();
  return db.collection("ragnarok_goldfarm")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Summarize gold farming results with optional date filter
 */
export async function summarizeGoldFarms(startDate = null, endDate = null) {
  const db = await connectDB();

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const runs = await db.collection("ragnarok_goldfarm")
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
 * Update a gold farm run
 */
export async function updateGoldFarm(id, updates) {
  const db = await connectDB();
  const { _id: _, ...safeUpdates } = updates;

  let query;
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    query = { _id: new ObjectId(id) };
  } else {
    query = { _id: id };
  }

  const result = await db.collection("ragnarok_goldfarm").updateOne(
    query,
    { $set: { ...safeUpdates, updatedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}

/* =============================
   GENERAL INCOME FUNCTIONS
   ============================= */

/**
 * Add an income source entry
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
  return db.collection("ragnarok_income")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Delete an income entry
 */
export async function deleteIncome(id) {
  const db = await connectDB();
  const result = await db.collection("ragnarok_income")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/**
 * Calculate total income summary
 */
export async function getIncomeSummary() {
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
 * Get a single income entry by ID
 */
export async function getIncomeDetail(id) {
  const db = await connectDB();
  return db.collection("ragnarok_income")
    .findOne({ _id: new ObjectId(id) });
}

/**
 * Update an income entry
 */
export async function updateIncome(id, updates) {
  const db = await connectDB();

  let _id;
  try {
    _id = new ObjectId(id);
  } catch (err) {
    throw new Error("Invalid income ID");
  }

  const result = await db.collection("ragnarok_income").updateOne(
    { _id },
    { $set: { ...updates, updatedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}

/* =============================
   HELPERS
   ============================= */
function convertToZenny(amount, type) {
  switch (type) {
    case "gold": return amount * GOLD_TO_ZENNY;
    case "credit": return amount * CREDIT_TO_ZENNY;
    default: return amount; // zenny
  }
}

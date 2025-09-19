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

  // Gold farm entry
  const entry = {
    account,
    goldEarned,
    hours,
    type: "gold",
    zennyEquivalent,
    createdAt: new Date(),
  };

  const result = await db.collection("ragnarok_goldfarm").insertOne(entry);

  // 🔥 Automatically create an income entry as well
  const incomeEntry = {
    source: `GOLD FARM | ${account}`,   // formatted as requested
    amount: goldEarned,
    type: "gold",
    zennyEquivalent,
    createdAt: new Date(),
    linkedGoldFarmId: result.insertedId, // optional, link back to gold farm
  };

  await db.collection("ragnarok_income").insertOne(incomeEntry);

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

/**
 * Ensure totals document exists
 */
async function ensureTotals(db) {
  const totals = await db.collection("ragnarok_totals").findOne({});
  if (!totals) {
    await db.collection("ragnarok_totals").insertOne({
      totalZenny: 0,
      totalGold: 0,
      totalCredits: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { totalZenny: 0, totalGold: 0, totalCredits: 0 };
  }
  return totals;
}

/**
 * Add Zenny income
 */
export async function addZenny(amount, source = "manual") {
  const db = await connectDB();
  await ensureTotals(db);

  await db.collection("ragnarok_totals").updateOne(
    {},
    { $inc: { totalZenny: amount }, $set: { updatedAt: new Date() } }
  );

  await db.collection("ragnarok_income").insertOne({
    source,
    type: "zenny",
    amount,
    zennyEquivalent: amount,
    createdAt: new Date(),
  });

  return true;
}

/**
 * Add Gold income
 */
export async function addGold(amount, source = "manual") {
  const db = await connectDB();
  await ensureTotals(db);

  const zennyEquivalent = amount * GOLD_TO_ZENNY;

  await db.collection("ragnarok_totals").updateOne(
    {},
    { $inc: { totalGold: amount }, $set: { updatedAt: new Date() } }
  );

  await db.collection("ragnarok_income").insertOne({
    source,
    type: "gold",
    amount,
    zennyEquivalent,
    createdAt: new Date(),
  });

  return true;
}

/**
 * Add Credit income
 */
export async function addCredit(amount, source = "manual") {
  const db = await connectDB();
  await ensureTotals(db);

  const zennyEquivalent = amount * CREDIT_TO_ZENNY;

  await db.collection("ragnarok_totals").updateOne(
    {},
    { $inc: { totalCredits: amount }, $set: { updatedAt: new Date() } }
  );

  await db.collection("ragnarok_income").insertOne({
    source,
    type: "credit",
    amount,
    zennyEquivalent,
    createdAt: new Date(),
  });

  return true;
}

/**
 * Convert between currencies (zenny, gold, credit)
 */
export async function convertCurrency(from, to, amount) {
  const db = await connectDB();
  const totals = await ensureTotals(db);

  let zennyDelta = 0, goldDelta = 0, creditDelta = 0;

  switch (from) {
    case "zenny":
      if (totals.totalZenny < amount) throw new Error("Not enough Zenny");
      if (to === "credit") {
        const credits = Math.floor(amount / CREDIT_TO_ZENNY);
        zennyDelta = -credits * CREDIT_TO_ZENNY;
        creditDelta = credits;
      } else if (to === "gold") {
        const gold = Math.floor(amount / GOLD_TO_ZENNY);
        zennyDelta = -gold * GOLD_TO_ZENNY;
        goldDelta = gold;
      }
      break;

    case "credit":
      if (totals.totalCredits < amount) throw new Error("Not enough Credits");
      if (to === "zenny") {
        zennyDelta = amount * CREDIT_TO_ZENNY;
        creditDelta = -amount;
      }
      break;

    case "gold":
      if (totals.totalGold < amount) throw new Error("Not enough Gold");
      if (to === "zenny") {
        zennyDelta = amount * GOLD_TO_ZENNY;
        goldDelta = -amount;
      }
      break;

    default:
      throw new Error("Unsupported conversion type");
  }

  await db.collection("ragnarok_totals").updateOne(
    {},
    {
      $inc: {
        totalZenny: zennyDelta,
        totalGold: goldDelta,
        totalCredits: creditDelta,
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );

  await db.collection("ragnarok_income").insertOne({
    source: `Conversion ${from}->${to}`,
    type: "conversion",
    from, to, amount,
    zennyDelta, goldDelta, creditDelta,
    createdAt: new Date(),
  });

  return { zennyDelta, goldDelta, creditDelta };
}

/**
 * Get current totals
 */
export async function getTotals() {
  const db = await connectDB();
  const totals = await ensureTotals(db);

  return {
    totalZenny: totals.totalZenny,
    totalGold: totals.totalGold,
    totalCredits: totals.totalCredits,
    netWorthZenny:
      totals.totalZenny +
      totals.totalGold * GOLD_TO_ZENNY +
      totals.totalCredits * CREDIT_TO_ZENNY,
  };
}

/**
 * Helper: Update totals after income or expense
 */
async function updateTotals(db) {
  const incomes = await db.collection("ragnarok_income").find({}).toArray();
  const expenses = await db.collection("ragnarok_expenses").find({}).toArray();

  let totalZenny = 0;
  let totalGold = 0;
  let totalCredits = 0;

  incomes.forEach((e) => {
    if (e.type === "zenny") totalZenny += e.amount;
    if (e.type === "gold") totalGold += e.amount;
    if (e.type === "credit") totalCredits += e.amount;
  });

  expenses.forEach((e) => {
    if (e.type === "zenny") totalZenny -= e.amount;
    if (e.type === "gold") totalGold -= e.amount;
    if (e.type === "credit") totalCredits -= e.amount;
  });

  const netWorthZenny =
    totalZenny +
    totalGold * GOLD_TO_ZENNY +
    totalCredits * CREDIT_TO_ZENNY;

  await db.collection("ragnarok_totals").updateOne(
    { _id: "totals" },
    {
      $set: {
        totalZenny,
        totalGold,
        totalCredits,
        netWorthZenny,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

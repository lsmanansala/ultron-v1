// modules/ragnarok/finance.js
import { connectDB } from "../../api/utils/db.js";
import { ObjectId } from "mongodb";

const GOLD_TO_ZENNY = 124000;
const CREDIT_TO_ZENNY = 10_000_000;

function toZenny(amount, type) {
  switch (type) {
    case "gold": return amount * GOLD_TO_ZENNY;
    case "credit": return amount * CREDIT_TO_ZENNY;
    default: return amount; // zenny
  }
}

async function updateTotals(db, type, amount, isExpense = false) {
  const totals = db.collection("ragnarok_totals");
  const doc = await totals.findOne({ _id: "totals" }) || {
    _id: "totals",
    zenny: 0,
    gold: 0,
    credit: 0,
  };

  const sign = isExpense ? -1 : 1;

  if (type === "zenny") doc.zenny += sign * amount;
  if (type === "gold") doc.gold += sign * amount;
  if (type === "credit") doc.credit += sign * amount;

  // always reflect net worth in zenny
  doc.netZenny = doc.zenny + doc.gold * GOLD_TO_ZENNY + doc.credit * CREDIT_TO_ZENNY;
  doc.updatedAt = new Date();

  await totals.updateOne({ _id: "totals" }, { $set: doc }, { upsert: true });
  return doc;
}

export async function addGoldFarm(account, goldEarned, hours = 3) {
  const db = await connectDB();

  const zennyEquivalent = goldEarned * GOLD_TO_ZENNY;
  const type = "gold";
  // Gold farm entry
  const entry = {
    account,
    goldEarned,
    hours,
    type,
    zennyEquivalent,
    createdAt: new Date(),
  };

  const result = await db.collection("ragnarok_goldfarm").insertOne(entry);

  // 🔥 Automatically create an income entry as well
  const incomeEntry = {
    source: `GOLD FARM | ${account}`,   // formatted as requested
    amount: goldEarned,
    type,
    zennyEquivalent,
    createdAt: new Date(),
  };

  await db.collection("ragnarok_income").insertOne(incomeEntry);
  await updateTotals(db, "gold", goldEarned, false);
  return result.insertedId;
}

// ===== INCOME =====
export async function addIncome(source, amount, type = "zenny") {
  const db = await connectDB();
  const entry = {
    source,
    amount,
    type,
    zennyEquivalent: toZenny(amount, type),
    createdAt: new Date(),
  };
  await db.collection("ragnarok_income").insertOne(entry);
  await updateTotals(db, type, amount, false);
  return entry;
}

export async function listIncome() {
  const db = await connectDB();
  return db.collection("ragnarok_income").find().sort({ createdAt: -1 }).toArray();
}

export async function updateIncome(id, updates) {
  const db = await connectDB();

  // Ensure valid ObjectId
  let _id;
  try {
    _id = new ObjectId(id);
  } catch (err) {
    throw new Error("Invalid income ID");
  }

  const incomeColl = db.collection("ragnarok_income");
  const existing = await incomeColl.findOne({ _id });
  if (!existing) throw new Error("Income record not found");

  // Roll back old totals first
  await updateTotals(db, existing.type, existing.amount, true);

  // Prepare new values
  const newAmount = updates.amount ?? existing.amount;
  const newType = updates.type ?? existing.type;
  const newSource = updates.source ?? existing.source;

  const updatePayload = {
    source: newSource,
    amount: newAmount,
    type: newType,
    zennyEquivalent: toZenny(newAmount, newType),
    updatedAt: new Date(),
  };

  // Update document
  await incomeColl.updateOne({ _id }, { $set: updatePayload });

  // Apply new totals
  await updateTotals(db, newType, newAmount, false);

  return true;
}

// ===== EXPENSES =====
export async function addExpense(source, amount, type = "zenny") {
  const db = await connectDB();
  const entry = {
    source,
    amount,
    type,
    zennyEquivalent: toZenny(amount, type),
    createdAt: new Date(),
  };
  await db.collection("ragnarok_expenses").insertOne(entry);
  await updateTotals(db, type, amount, true);
  return entry;
}

export async function listExpenses() {
  const db = await connectDB();
  return db.collection("ragnarok_expenses").find().sort({ createdAt: -1 }).toArray();
}

// ===== TOTALS =====
export async function getTotals() {
  const db = await connectDB();
  return db.collection("ragnarok_totals").findOne({ _id: "totals" });
}

// ===== CONVERSIONS =====
export async function convertCurrency(from, to, amount) {
  const db = await connectDB();
  const totals = db.collection("ragnarok_totals");

  const doc = await totals.findOne({ _id: "totals" });
  if (!doc) throw new Error("Totals not initialized yet");

  if (amount <= 0) throw new Error("Amount must be positive");

  // Conversion rates
  const GOLD_TO_ZENNY = 124000;
  const CREDIT_TO_ZENNY = 10_000_000;

  const rates = {
    zenny: 1,
    gold: GOLD_TO_ZENNY,
    credit: CREDIT_TO_ZENNY,
  };

  if (!rates[from] || !rates[to]) throw new Error("Invalid currency type");

  // Check available balance
  if (doc[from] < amount) {
    throw new Error(`Insufficient ${from} to convert`);
  }

  // Convert to zenny equivalent
  const zennyValue = amount * rates[from];
  const convertedAmount = zennyValue / rates[to];

  // Deduct from "from", add to "to"
  doc[from] -= amount;
  doc[to] += convertedAmount;

  // Update net worth
  doc.netZenny =
    doc.zenny + doc.gold * GOLD_TO_ZENNY + doc.credit * CREDIT_TO_ZENNY;
  doc.updatedAt = new Date();

  await totals.updateOne({ _id: "totals" }, { $set: doc });

  return {
    from,
    to,
    amount,
    convertedAmount,
    totals: doc,
  };
}

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
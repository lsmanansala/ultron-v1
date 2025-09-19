// api/routes/ragnarokFinance.js
import express from "express";
import {
  addIncome,
  listIncome,
  addExpense,
  listExpenses,
  getTotals,
  convertCurrency,
  updateIncome
} from "../../modules/ragnarok/finance.js";

const router = express.Router();

// Income
router.post("/income", async (req, res) => {
  try {
    const { source, amount, type } = req.body;
    const entry = await addIncome(source, amount, type);
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/income", async (_, res) => {
  const list = await listIncome();
  res.json(list);
});

router.put("/income/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await updateIncome(id, req.body);

    if (!success) {
      return res.status(404).json({ error: "Income record not found or not updated" });
    }

    res.json({ message: "Income record updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Expenses
router.post("/expenses", async (req, res) => {
  try {
    const { source, amount, type } = req.body;
    const entry = await addExpense(source, amount, type);
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/expenses", async (_, res) => {
  const list = await listExpenses();
  res.json(list);
});

// Totals
router.get("/totals", async (_, res) => {
  const totals = await getTotals();
  res.json(totals);
});

// Convert between currencies
router.post("/convert", async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    const result = await convertCurrency(from, to, amount);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

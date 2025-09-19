// api/routes/ragnarokIncome.js
import express from "express";
import {
  addIncome,
  listIncome,
  deleteIncome,
  getIncomeDetail,
  getIncomeSummary,
  updateIncome,
  addZenny,
  addGold,
  addCredit,
  convertCurrency,
  getTotals,
} from "../../modules/ragnarok/income.js";

const router = express.Router();

// Add income
router.post("/", async (req, res) => {
  const { source, amount, type } = req.body;
  if (!source || !amount)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const id = await addIncome(source, amount, type || "zenny");
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List income entries
router.get("/", async (_, res) => {
  const entries = await listIncome();
  res.json(entries);
});

// Summary
router.get("/summary", async (req, res) => {
  const summary = await getIncomeSummary();
  console.log(summary);
  res.json(summary);
});

// get income details
router.get("/:id", async (req, res) => {
  const craft = await getIncomeDetail(req.params.id);
  if (!craft) return res.status(404).json({ error: "Not found" });
  res.json(craft);
});

// Update an income record
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await updateIncome(id, req.body);

    if (!success) {
      return res
        .status(404)
        .json({ error: "Income record not found or not updated" });
    }

    res.json({ message: "Income record updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete income entry
router.delete("/:id", async (req, res) => {
  const success = await deleteIncome(req.params.id);
  res.json({ success });
});

router.post("/zenny", async (req, res) => {
  try {
    await addZenny(req.body.amount, req.body.source);
    res.json({ message: "Zenny added" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/gold", async (req, res) => {
  try {
    await addGold(req.body.amount, req.body.source);
    res.json({ message: "Gold added" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/credit", async (req, res) => {
  try {
    await addCredit(req.body.amount, req.body.source);
    res.json({ message: "Credit added" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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

// Get totals
router.get("/totals", async (req, res) => {
  try {
    const totals = await getTotals();
    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

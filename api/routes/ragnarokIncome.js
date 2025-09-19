// api/routes/ragnarokIncome.js
import express from "express";
import {
  addIncome,
  listIncome,
  deleteIncome,
  getIncomeDetail,
  getIncomeSummary,
  updateIncome,
} from "../../modules/ragnarok/income.js";

const router = express.Router();

// Add income
router.post("/income", async (req, res) => {
  const { source, amount, type } = req.body;
  if (!source || !amount) return res.status(400).json({ error: "Missing fields" });

  try {
    const id = await addIncome(source, amount, type || "zenny");
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List income entries
router.get("/income", async (_, res) => {
  const entries = await listIncome();
  res.json(entries);
});

// Summary
router.get("/income/summary", async (req, res) => {
  const summary = await getIncomeSummary();
  console.log(summary)
  res.json(summary);
});

// get income details
router.get("/income/:id", async (req, res) => {
  const craft = await getIncomeDetail(req.params.id);
  if (!craft) return res.status(404).json({ error: "Not found" });
  res.json(craft);
});

// Update an income record
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

// Delete income entry
router.delete("/income/:id", async (req, res) => {
  const success = await deleteIncome(req.params.id);
  res.json({ success });
});



export default router;

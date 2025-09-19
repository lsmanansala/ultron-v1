// api/routes/ragnarokGold.js
import express from "express";
import {
  addGoldFarm,
  listGoldFarms,
  summarizeGoldFarms,
  listGoldFarmsByDate
} from "../../modules/ragnarok/income.js";

const router = express.Router();

// Filter gold farms by date range
router.get("/goldfarm/filter", async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start && !end) {
      return res.status(400).json({ error: "Please provide start or end date" });
    }

    const runs = await listGoldFarmsByDate(start, end);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add gold farm run
router.post("/goldfarm", async (req, res) => {
  const { account, goldEarned, hours } = req.body;
  if (!account || !goldEarned) {
    return res.status(400).json({ error: "Missing account or goldEarned" });
  }

  try {
    const id = await addGoldFarm(account, goldEarned, hours || 3);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all runs
router.get("/goldfarm", async (_, res) => {
  const runs = await listGoldFarms();
  res.json(runs);
});

// Summary with optional start/end query
router.get("/goldfarm/summary", async (req, res) => {
  try {
    const { start, end } = req.query;
    const summary = await summarizeGoldFarms(start, end);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

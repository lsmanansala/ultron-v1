// api/routes/ragnarokCrafting.js
import express from "express";
import {
  addCraft,
  listCrafts,
  getCraft,
  updateCraft,
  deleteCraft,
  calculateCraftable,
} from "../../modules/ragnarok/crafting.js";

const router = express.Router();

// Create
router.post("/", async (req, res) => {
  const { itemName, requirements } = req.body;
  if (!itemName) return res.status(400).json({ error: "itemName required" });

  try {
    const id = await addCraft(itemName, requirements || []);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read
router.get("/", async (_, res) => {
  const crafts = await listCrafts();
  res.json(crafts);
});

router.get("/:id", async (req, res) => {
  const craft = await getCraft(req.params.id);
  if (!craft) return res.status(404).json({ error: "Not found" });
  res.json(craft);
});

// Update
router.put("/:id", async (req, res) => {
  const success = await updateCraft(req.params.id, req.body);
  res.json({ success });
});

// Delete
router.delete("/:id", async (req, res) => {
  const success = await deleteCraft(req.params.id);
  res.json({ success });
});

// Calculate
router.get("/:id/calc", async (req, res) => {
  const result = await calculateCraftable(req.params.id);
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(result);
});

export default router;

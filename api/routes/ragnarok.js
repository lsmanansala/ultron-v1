import express from "express";
import {
  addAccount,
  listAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
} from "../../modules/ragnarok/accounts.js";

const router = express.Router();

// Create
router.post("/accounts", async (req, res) => {
  const { username, description, purpose } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const id = await addAccount(username, description, purpose);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read
router.get("/accounts", async (req, res) => {
  const accounts = await listAccounts();
  res.json(accounts);
});

router.get("/accounts/:id", async (req, res) => {
  try {
    const account = await getAccount(req.params.id);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Update
router.put("/accounts/:id", async (req, res) => {
  const success = await updateAccount(req.params.id, req.body);
  res.json({ success });
});

// Delete
router.delete("/accounts/:id", async (req, res) => {
  const success = await deleteAccount(req.params.id);
  res.json({ success });
});

export default router;

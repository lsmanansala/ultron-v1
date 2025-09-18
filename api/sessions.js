// api/sessions.js
import express from "express";
import { listSessions, getSession, deleteSession } from "./services/sessions.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const sessions = await listSessions();
    res.json(sessions);
  } catch (err) {
    console.error("[API] sessions list error:", err);
    res.status(500).json({ error: "Could not fetch sessions" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    console.error("[API] sessions get error:", err);
    res.status(500).json({ error: "Could not fetch session" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteSession(req.params.id);
    if (result.deletedCount === 0) return res.status(404).json({ error: "Session not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("[API] sessions delete error:", err);
    res.status(500).json({ error: "Could not delete session" });
  }
});

export default router;

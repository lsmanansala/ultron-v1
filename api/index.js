import express from "express";
import cors from "cors";
import "dotenv/config";

import { handleInput } from "../services/brain.js";
import sessionsRouter from "./sessions.js";
import ragnarokAccountsRoutes from "./routes/ragnarokAccounts.js";
import ragnarokCraftingRoutes from "./routes/ragnarokCrafting.js";
import ragnarokIncomeRoutes from "./routes/ragnarokIncome.js";
import ragnarokGoldRoutes from "./routes/ragnarokGold.js";

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());

// --- Commands ---
app.post("/api/command", async (req, res) => {
  const input = req.body.input?.trim();
  const source = req.get("X-Ultron-Source") || "api";
  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Missing or invalid input" });
  }

  try {
    const response = await handleInput(input, true, source); // default source
    res.json({ reply: response });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Sessions ---
app.use("/api/sessions", sessionsRouter);

// ragnarok
app.use("/api/ragnarok", ragnarokAccountsRoutes);
app.use("/api/ragnarok/crafts", ragnarokCraftingRoutes);
app.use("/api/ragnarok", ragnarokIncomeRoutes);
app.use("/api/ragnarok", ragnarokGoldRoutes);

app.listen(PORT, () => {
  console.log(`[Ultron API] Listening at http://localhost:${PORT}`);
});

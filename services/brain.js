// services/brain.js
import { getUltronReply, resetUltronMemory } from "./llm.js";
import { speak, changeVoice } from "../utils/speech.js";
import { logAction, logToWindowsEvent } from "../utils/logger.js";
import { sanitizeInput, sanitizeReply } from "../utils/security.js";
import { parseUltronCommand } from "../utils/commands.js";
import { connectDB } from "../api/utils/db.js";

const conversationHistory = [];

// Track current session
let currentSession = null;

function cleanReply(text) {
  if (!text) return "";
  return text
    .replace(/<\s*\/?s\s*>/gi, "")
    .replace(/[\r\n]+/g, "")
    .replace(/\s{2,}/g, "")
    .trim();
}

function startSession(firstMessage, source) {
  currentSession = {
    title: firstMessage.slice(0, 50) || `Session ${new Date().toLocaleString()}`,
    date: new Date(),
    source,
    messages: [],
  };
  console.log(`[Ultron Session] Started: "${currentSession.title}"`);
}

async function saveSession() {
  if (!currentSession) return;
  try {
    const db = await connectDB();
    await db.collection("sessions").insertOne(currentSession);
    console.log(`[MongoDB] Saved session: "${currentSession.title}"`);
  } catch (err) {
    console.error("[MongoDB] Failed to save session:", err.message);
  } finally {
    currentSession = null; // reset
  }
}

/**
 * @param {string} rawInput
 * @param {boolean} apiMode
 */
export async function handleInput(
  rawInput,
  apiMode = false,
  source = "unknown"
) {
  const sanitizedInput = sanitizeInput(rawInput);

  if (sanitizedInput !== rawInput) {
    await logAction(
      "USER",
      `Input sanitized: ${rawInput} -> ${sanitizedInput}`,
      3
    );
    logToWindowsEvent("Blocked potentially malicious input", "WARNING");
  }

  if (!currentSession) {
    startSession(sanitizedInput, source);
  }

  const result = await parseUltronCommand(
    sanitizedInput,
    conversationHistory,
    apiMode,
    source,
    currentSession
  );

  if (result?.handled) {
    console.log(result)
    if (result.action === "enableDevMode") global.ultronDevMode = true;
    if (result.action === "disableDevMode") global.ultronDevMode = false;
    if (result.action === "changeVoice") changeVoice();
    if (result.action === "saveSession") await saveSession()

    if (apiMode) {
      return result.reply || "";
    }
    return;
  }

  try {
    await logAction("USER", `Command: ${sanitizedInput}`, 1);
    const reply = await getUltronReply(sanitizedInput);
    console.log

    if (reply === "<s>") {
      return "System instability detected";
    } else {
      const entryUser = {
        role: "user",
        content: sanitizedInput,
        timestamp: new Date(),
        source,
      };
      const entryUltron = {
        role: "ultron",
        content: reply,
        timestamp: new Date(),
        source,
      };

      conversationHistory.push(entryUser, entryUltron);
      currentSession.messages.push(entryUser, entryUltron);

      if (!apiMode) {
        console.log("Ultron:", reply);
        await speak(sanitizeReply(reply));
      }

      return apiMode ? cleanReply(reply) : reply;
    }
  } catch (err) {
    await logAction("SYSTEM", `Error: ${err.message}`, 5);
    logToWindowsEvent(`Critical error: ${err.message}`, "ERROR");

    const fallback = "System instability detected";
    if (!apiMode) {
      console.error("Ultron:", fallback);
      await speak("Security protocols activated. Stabilizing...");
    }
    return fallback;
  }
}

// Graceful shutdown → save unfinished session
process.on("SIGINT", async () => {
  console.log("\n[Ultron] Shutting down, saving session...");
  await saveSession();
  process.exit();
});

process.on("SIGTERM", async () => {
  console.log("\n[Ultron] Terminated, saving session...");
  await saveSession();
  process.exit();
});

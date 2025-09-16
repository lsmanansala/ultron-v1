// services/brain.js
import { getUltronReply, resetUltronMemory } from './llm.js';
import { speak, changeVoice } from '../utils/speech.js';
import { logAction, logToWindowsEvent } from '../utils/logger.js';
import { sanitizeInput, sanitizeReply } from '../utils/security.js';
import { parseUltronCommand } from '../utils/commands.js';
import { connectDB } from "../utils/db.js";

const conversationHistory = [];

function cleanReply(text) {
  if (!text) return "";
  return text
    .replace(/[\r\n]+/g, " ") 
    .replace(/\s{2,}/g, " ") 
    .trim();
}

async function saveConversation(user, ultron) {
  const db = await connectDB();
  await db.collection("conversations").insertOne({
    timestamp: new Date(),
    user,
    ultron
  });
}

/**
 * @param {string} rawInput
 * @param {boolean} apiMode  // when true, return strings instead of speaking/printing
 */
export async function handleInput(rawInput, apiMode = false) {
  const sanitizedInput = sanitizeInput(rawInput);

  if (sanitizedInput !== rawInput) {
    await logAction('USER', `Input sanitized: ${rawInput} -> ${sanitizedInput}`, 3);
    logToWindowsEvent('Blocked potentially malicious input', 'WARNING');
  }

  const result = await parseUltronCommand(sanitizedInput, conversationHistory, apiMode);
  
  if (result?.handled) {
    if (result.action === 'enableDevMode') global.ultronDevMode = true;
    if (result.action === 'disableDevMode') global.ultronDevMode = false;
    if (result.action === 'changeVoice') changeVoice();

    
    if (apiMode) {
      return cleanReply(result.reply) || ''
    };

    return;
  }

  // Not a command -> call LLM
  try {
    await logAction('USER', `Command: ${sanitizedInput}`, 1);
    const reply = await getUltronReply(sanitizedInput);

    const entryUser = { role: 'user', content: sanitizedInput, timestamp: new Date() };
    const entryUltron = { role: 'ultron', content: reply, timestamp: new Date() };
    conversationHistory.push(entryUser, entryUltron);

    try {
      const db = await connectDB();
      await db.collection("conversations").insertMany([entryUser, entryUltron]);
    } catch (dbErr) {
      console.error("[MongoDB Conversation Save Failed]", dbErr.message);
    }

    if (!apiMode) {
      await speak(sanitizeReply(reply));
    }

    return reply;
  } catch (err) {
    await logAction('SYSTEM', `Error: ${err.message}`, 5);
    logToWindowsEvent(`Critical error: ${err.message}`, 'ERROR');

    const fallback = 'System instability detected';
    if (!apiMode) {
      console.error('Ultron:', fallback);
      await speak('Security protocols activated. Stabilizing...');
    }
    return fallback;
  }
}

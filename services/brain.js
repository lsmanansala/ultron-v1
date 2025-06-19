import { getUltronReply, resetUltronMemory } from './llm.js';
import { speak, changeVoice } from '../utils/speech.js';
import { logAction, logToWindowsEvent } from '../utils/logger.js';
import { sanitizeInput, sanitizeReply } from '../utils/security.js';
import { parseUltronCommand } from '../utils/commands.js';

const conversationHistory = [];

export async function handleInput(rawInput) {
  const sanitizedInput = sanitizeInput(rawInput);

  if (sanitizedInput !== rawInput) {
    await logAction('USER', `Input sanitized: ${rawInput} -> ${sanitizedInput}`, 3);
    logToWindowsEvent('Blocked potentially malicious input', 'WARNING');
  }

  const commandHandled = await parseUltronCommand(sanitizedInput, conversationHistory);

  if (commandHandled === true) return;
  if (commandHandled === 'enableDevMode') {
    global.ultronDevMode = true;
    return;
  }

  if (commandHandled === 'disableDevMode') {
    global.ultronDevMode = false;
    return;
  }

  if (commandHandled === 'changeVoice') {
    changeVoice();
    return;
  }

  try {
    await logAction('USER', `Command: ${sanitizedInput}`, 1);
    const reply = await getUltronReply(sanitizedInput);

    conversationHistory.push({ role: 'user', content: sanitizedInput });
    conversationHistory.push({ role: 'ultron', content: reply });

    console.log('Ultron:', reply);
    await speak(sanitizeReply(reply));
    return reply;
  } catch (err) {
    await logAction('SYSTEM', `Error: ${err.message}`, 5);
    logToWindowsEvent(`Critical error: ${err.message}`, 'ERROR');

    const fallback = 'System instability detected';
    console.error('Ultron:', fallback);
    await speak('Security protocols activated. Stabilizing...');
    return fallback;
  }
}

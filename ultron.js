import readline from "readline";
import { getUltronReply, resetUltronMemory } from "./services/llm.js";
import { speak, changeVoice } from "./utils/speech.js";
import { logAction, logToWindowsEvent } from "./utils/logger.js";
import { sanitizeInput, sanitizeReply } from "./utils/security.js";
import { parseUltronCommand } from "./utils/commands.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const conversationHistory = [];

async function handleInput(input) {
  const sanitizedInput = sanitizeInput(input);

  if (sanitizedInput !== input) {
    await logAction(
      "USER",
      `Input sanitized: ${input} -> ${sanitizedInput}`,
      3
    );
    logToWindowsEvent("Blocked potentially malicious input", "WARNING");
  }

  const commandHandled = await parseUltronCommand(
    sanitizedInput,
    conversationHistory
  );

  if (commandHandled === true) return;
  if (commandHandled === "enableDevMode") {
    global.ultronDevMode = true;
    return;
  }

  if (commandHandled === "disableDevMode") {
    global.ultronDevMode = false;
    return;
  }
  
  if (commandHandled === "changeVoice") {
    console.log('changeVoice')
    changeVoice()
    return;
  }

  try {
    await logAction("USER", `Command: ${sanitizedInput}`, 1);
    process.stdout.write("Ultron is processing...\r");

    const reply = await getUltronReply(sanitizedInput);

    conversationHistory.push({ role: "user", content: sanitizedInput });
    conversationHistory.push({ role: "ultron", content: reply });

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    console.log("Ultron:", reply);
    await speak(sanitizeReply(reply));
  } catch (err) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    await logAction("SYSTEM", `Error: ${err.message}`, 5);
    logToWindowsEvent(`Critical error: ${err.message}`, "ERROR");

    console.error("Ultron:", "System instability detected");
    await speak("Security protocols activated. Stabilizing...");
  }
}

function prompt() {
  rl.question("\nYou: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      await logAction("SYSTEM", "Session terminated by user", 1);
      logToWindowsEvent("Ultron session ended normally", "INFO");
      await speak("Ultron out.");
      rl.close();
      return;
    }

    await handleInput(input);
    prompt();
  });
}

// === Session Inititialize === //
console.log(`
  ╔════════════════════════════╗
  ║  U L T R O N   O N L I N E ║
  ╚════════════════════════════╝
  Type "exit" to quit.
`);

logAction("SYSTEM", "Ultron initialized", 1);
speak("Security systems engaged. All systems nominal.");
prompt();

import readline from "readline";
import { getUltronReply, resetUltronMemory } from "./services/llm.js";
import { speak, changeVoice } from "./utils/speech.js";
import { logAction, logToWindowsEvent } from "./utils/logger.js";
import { sanitizeInput, sanitizeReply } from "./utils/security.js";
import { parseUltronCommand } from "./utils/commands.js";
import { handleInput } from './services/brain.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

export { handleInput }; // add this line

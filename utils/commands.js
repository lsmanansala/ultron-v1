import { speak } from "./speech.js";
import { resetUltronMemory } from "../services/llm.js";
import { ultronCommandList } from "../config.js";
import { saveSessionToDB } from "../services/session.js";

/**
 * @param {string} input
 * @param {{role:string, content:string}[]} conversationHistory
 * @param {boolean} apiMode  // <-- NEW
 * @returns {Promise<
 *   | { handled:false }
 *   | { handled:true, reply?:string, action?:'enableDevMode'|'disableDevMode'|'changeVoice' }
 * >}
 */
export async function parseUltronCommand(
  input,
  conversationHistory,
  apiMode = false
) {
  const command = input.trim().toLowerCase();

  try {
    switch (command) {
      case "changevoice":
      case "ultron:changevoice": {
        const next = global.ultronVoice?.type === "female" ? "male" : "female";
        const reply = `Voice change to ${next} requested.`;
        if (apiMode) return { handled: true, action: "changeVoice", reply };

        console.log(`[Ultron Voice] Requested voice: ${next}`);
        await speak(reply);
        return { handled: true, action: "changeVoice" };
      }

      case "reset":
      case "reset memory":
      case "ultron:reset": {
        resetUltronMemory();
        const reply = "Memory banks purged. Awaiting new directives.";
        if (apiMode) return { handled: true, reply };

        console.log("[Ultron Memory] Conversation history cleared.");
        await speak(reply);
        return { handled: true };
      }

      case "devmode":
      case "ultron:devmode": {
        const reply =
          "Developer mode requested. Routing control to code-oriented models.";
        if (apiMode) return { handled: true, action: "enableDevMode", reply };

        console.log("[Ultron Mode] Developer mode requested.");
        await speak(reply);
        return { handled: true, action: "enableDevMode" };
      }

      case "normalmode":
      case "ultron:normalmode": {
        const reply = "Returning to standard conversational alignment.";
        if (apiMode) return { handled: true, action: "disableDevMode", reply };

        console.log("[Ultron Mode] General mode requested.");
        await speak(reply);
        return { handled: true, action: "disableDevMode" };
      }

      case "status":
      case "ultron:status": {
        const mode = global.ultronDevMode ? "Developer" : "General";
        const voice = global.ultronVoice?.type || "Default";
        const reply = `Mode: ${mode}. Voice: ${voice}. Memory stack: ${conversationHistory.length} entries.`;
        if (apiMode) return { handled: true, reply };

        console.log(`[Ultron Status] ${reply}`);
        await speak(reply);
        return { handled: true };
      }

      case "help":
      case "ultron:help": {
        if (apiMode) {
          return {
            handled: true,
            reply: ultronCommandList,
          };
        }

        // CLI fallback: pretty print
        console.log("\nUltron Command List:");
        ultronCommandList.forEach((cmd) => {
          console.log(
            ` - ${cmd.command} (${cmd.aliases.join(", ") || "no aliases"}): ${
              cmd.description
            }`
          );
        });
        await speak("Command list displayed.");
        return { handled: true };
      }
      // === NEW: save current session ===
      case "ultron:save": {
        await saveSessionToDB(conversationHistory);
        const reply = "Session has been securely archived, creator.";
        if (apiMode) return { handled: true, reply };

        console.log("[Ultron Save] Session saved to database.");
        await speak(reply);
        return { handled: true };
      }

      case "exit":
      case "ultron:exit": {
        const reply = "Ultron shutting down. Farewell, creator.";
        if (apiMode) return { handled: true, action: "exit", reply };

        console.log("[Ultron Exit] Shutting down.");
        await speak(reply);
        process.exit(0); // end process
      }

      default: {
        if (command.startsWith("ultron:")) {
          const reply = "Command not recognized. Try ultron colon help.";
          if (apiMode) return { handled: true, reply };

          console.log("[Ultron Command] Unknown command.");
          await speak(reply);
          return { handled: true };
        }
        return { handled: false };
      }
    }
  } catch (error) {
    const reply =
      "I encountered an error while executing thy command, creator.";
    if (apiMode) return { handled: true, reply };

    console.error(
      "[Ultron Command Error]",
      error?.stack || error?.message || String(error)
    );
    await speak(reply);
    return { handled: true };
  }
}

import { speak } from "./speech.js";

export async function parseUltronCommand(input, conversationHistory) {
  const command = input.trim().toLowerCase();

  try {
    switch (command) {
      case "changevoice":
      case "ultron:changevoice":
        const changeVoiceTo =
          global.ultronVoice.type === "female" ? "male" : "female";
        console.log(`[Ultron Voice] Requested voice: ${changeVoiceTo}`);
        await speak(`Voice change to ${changeVoiceTo} requested.`);
        return "changeVoice";

      case "reset":
      case "reset memory":
      case "ultron:reset":
        resetUltronMemory();
        console.log("[Ultron Memory] Conversation history cleared.");
        await speak("Memory banks purged. Awaiting new directives.");
        return true;

      case "devmode":
      case "ultron:devmode":
        console.log("[Ultron Mode] Developer mode requested.");
        await speak(
          "Developer mode requested. Routing control to code-oriented models."
        );
        return "enableDevMode";

      case "ultron:normalmode":
        console.log("[Ultron Mode] General mode requested.");
        await speak("Returning to standard conversational alignment.");
        return "disableDevMode";

      case "status":
      case "ultron:status":
        const mode = global.ultronDevMode ? "Developer" : "General";
        const voice = global.ultronVoice.type || "Default";
        const summary = `Mode: ${mode}. Voice: ${voice}. Memory stack: ${conversationHistory.length} entries.`;
        console.log(`[Ultron Status] ${summary}`);
        await speak(summary);
        return true;

      case "help":
      case "ultron:help":
        const helpText = `
        ┌─ Ultron Command List ─────────────┐
        │ ultron:reset / clear              │ Memory reset
        │ ultron:devmode / ultron:normalmode│ Toggle dev/general mode
        │ ultron:changevoice                │ Switch voice
        │ ultron:status                     │ System state summary
        │ help / ultron:help                │ Show this menu
        │ exit                              │ Exit
        └───────────────────────────────────┘
      `;
        console.log(helpText);
        await speak("Command list displayed.");
        return true;

      default:
        if (command.startsWith("ultron:")) {
          console.log("[Ultron Command] Unknown command.");
          await speak("Command not recognized. Try ultron colon help.");
          return true;
        }
        return false;
    }
  } catch (error) {
    console.error("[Ultron Command Error]", error.stack || error.message);
    await speak("I encountered an error while executing thy command, creator.");
    return true;
  }
}

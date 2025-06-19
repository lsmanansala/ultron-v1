import readline from 'readline';
import { handleInput } from '../services/brain.js';
import { speak } from "../utils/speech.js"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`
╔══════════════════════════════╗
║  U L T R O N   C L I   M O D ║
╚══════════════════════════════╝
Type "exit" to quit.
`);

speak("Security systems engaged. All systems nominal.");
prompt();

function prompt() {
  rl.question('\nYou: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('Session ended.');
      rl.close();
      return;
    }

    await handleInput(input);
    prompt();
  });
}

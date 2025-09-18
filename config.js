import 'dotenv/config';

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const DEEPSEEK_CHAT_MODEL = 'deepseek/deepseek-chat-v3-0324:free';
export const OPEN_ROUTER_BASE_URL = process.env.BASE_URL;
export const GENERAL_MODELS  = [
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-12b-it:free',
  'deepseek/deepseek-chat-v3-0324:free',
];
export const DEV_MODELS = [
  'openai/gpt-4.1-mini',
  'google/gemini-2.5-flash',
  'anthropic/claude-sonnet-4'
];

export const ultronCommandList = [
  {
    command: "ultron:reset",
    aliases: ["reset", "reset memory"],
    description: "Clear conversation memory"
  },
  {
    command: "ultron:devmode",
    aliases: ["devmode"],
    description: "Switch to developer mode (uses dev models)"
  },
  {
    command: "ultron:normalmode",
    aliases: ["normalmode"],
    description: "Return to general mode"
  },
  {
    command: "ultron:changevoice",
    aliases: ["changevoice"],
    description: "Switch voice between male/female"
  },
  {
    command: "ultron:status",
    aliases: ["status"],
    description: "Show current mode, voice, and memory stack size"
  },
  {
    command: "ultron:help",
    aliases: ["help"],
    description: "Display available commands"
  },
  {
    command: "exit",
    aliases: [],
    description: "Exit Ultron CLI"
  }
];
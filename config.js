import 'dotenv/config';

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const DEEPSEEK_CHAT_MODEL = 'deepseek/deepseek-chat-v3-0324:free';
export const OPEN_ROUTER_BASE_URL = process.env.BASE_URL;
export const GENERAL_MODELS  = [
  'deepseek/deepseek-chat-v3-0324:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-12b-it:free'
];
export const DEV_MODELS = [
  'deepseek/deepseek-r1:free',
  'mistralai/mistral-7b-instruct:free'
];
import OpenAI from 'openai';
import { personalityPrompt } from '../utils/personality.js';
import { 
  OPENROUTER_API_KEY, 
  GENERAL_MODELS, 
  DEV_MODELS 
} from '../config.js';

const modelState = {
  activeModels: [...GENERAL_MODELS],
  isDevMode: false,
  rateLimits: {}
};

const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

let conversationHistory = [{ role: "system", content: personalityPrompt }];

export async function getUltronReply(message) {
  checkForDevModeCommand(message);

  let attempts = 0;
  const maxAttempts = modelState.activeModels.length * 2;

  while (attempts++ < maxAttempts) {
    const model = selectOptimalModel();
    try {
      if (isApproachingLimit(model)) {
        rotateActiveModel();
        continue;
      }

      const completion = await openai.chat.completions.create({
        model,
        messages: [...conversationHistory, { role: 'user', content: message }],
        temperature: modelState.isDevMode ? 0.3 : 0.7,
        max_tokens: modelState.isDevMode ? 300 : 150,
        timeout: 10000
      });

      const aiReply = completion.choices[0]?.message?.content || "[...]";

      updateModelState(model);
      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiReply }
      );

      return aiReply;

    } catch (err) {
      handleModelError(err, model);
    }
  }

  return "All systems are currently overloaded. Please try again later.";
}

// --- Developer Mode Activation Command Detection --- //

function checkForDevModeCommand(message) {
  const lower = message.toLowerCase();

  if (lower.includes("activate developer mode") || lower.includes("enable dev mode")) {
    if (!modelState.isDevMode) {
      activateDeveloperMode();
    }
  } else if (lower.includes("deactivate developer mode") || lower.includes("disable dev mode")) {
    if (modelState.isDevMode) {
      activateGeneralMode();
    }
  }
}

// --- Mode Switching Functions --- //

function activateDeveloperMode() {
  modelState.activeModels = [...DEV_MODELS];
  modelState.isDevMode = true;
  console.log('Switched to developer models:', DEV_MODELS);
}

function activateGeneralMode() {
  modelState.activeModels = [...GENERAL_MODELS];
  modelState.isDevMode = false;
  console.log('Switched to general models:', GENERAL_MODELS);
}

// --- Model Selection --- //

function selectOptimalModel() {
  modelState.activeModels.forEach(model => {
    if (!modelState.rateLimits[model]) {
      modelState.rateLimits[model] = {
        calls: 0,
        windowStart: Date.now(),
        windowLimit: modelState.isDevMode ? 10 : 5
      };
    }
  });

  const availableModels = modelState.activeModels.filter(model => 
    !isApproachingLimit(model)
  );

  return availableModels[0] || modelState.activeModels[0];
}

// --- Placeholder Helper Functions (unchanged from your setup) --- //

function isApproachingLimit(model) {
  const limit = modelState.rateLimits[model];
  const timePassed = Date.now() - limit.windowStart;
  const windowMs = 60 * 60 * 1000;

  if (timePassed > windowMs) {
    limit.calls = 0;
    limit.windowStart = Date.now();
  }

  return limit.calls >= limit.windowLimit;
}

function updateModelState(model) {
  if (modelState.rateLimits[model]) {
    modelState.rateLimits[model].calls += 1;
  }
}

function rotateActiveModel() {
  const current = modelState.activeModels.shift();
  modelState.activeModels.push(current);
}

function handleModelError(err, model) {
  console.error(`Model ${model} failed:`, err.message);
  updateModelState(model); // still increment to avoid retry storm
}

export function resetUltronMemory() {
  conversationHistory = [{ role: "system", content: personalityPrompt }];
}

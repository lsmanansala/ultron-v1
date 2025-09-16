const axios = require('axios');
const { OPENROUTER_API_KEY, DEEPSEEK_CHAT_MODEL } = require('../config');
const { personalityPrompt } = require('./personality');

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function getUltronReply(message) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: DEEPSEEK_CHAT_MODEL,
        messages: [
          { role: 'system', content: personalityPrompt },
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('Ultron failed:', err?.response?.data || err.message);
    return 'Something went wrong, creator.';
  }
}

module.exports = { getUltronReply };

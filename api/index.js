import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import { handleInput } from '../services/brain.js';

const app = express();
const PORT = process.env.PORT || 3030;


app.use(cors());
app.use(express.json());

app.post('/api/command', async(req, res) => {
  const input = req.body.input?.trim();
  if (!input || typeof input !== 'string') {
    return res.status(400).json({error: 'Missing or invalid input'});
  }

  try {
    const response = await handleInput(input, true);
    res.json({reply: response});
  } catch (err) {
    console.error('API ERROR: 1', err)
    res.status(500).json({error: 'Internal server error'});
  }
})

app.listen(PORT, () => {
  console.log(`[Ultron API] Listening at http://localhost:${PORT}`)
})
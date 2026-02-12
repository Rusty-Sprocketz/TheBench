const express = require('express');
const OpenAI = require('openai').default;
const { OPERATOR_SYSTEM_PROMPT } = require('../prompts/operator');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: OPERATOR_SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const text = response.choices[0].message.content;
    const hasVerdict = text.includes('[VERDICT]');

    res.json({
      agent: 'operator',
      model: 'GPT-4o (OpenAI)',
      message: text,
      hasVerdict,
    });
  } catch (error) {
    console.error('Operator agent error:', error.message);
    res.status(500).json({ error: 'The Operator is temporarily unavailable.' });
  }
});

module.exports = router;

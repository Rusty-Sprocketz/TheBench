const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const { ARCHITECT_SYSTEM_PROMPT } = require('../prompts/architect');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      system: ARCHITECT_SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text = response.content[0].text;
    const hasVerdict = text.includes('[VERDICT]');

    res.json({
      agent: 'architect',
      model: 'Claude Sonnet 4.5 (Anthropic)',
      message: text,
      hasVerdict,
    });
  } catch (error) {
    console.error('Architect agent error:', error.message);
    res.status(500).json({ error: 'The Architect is temporarily unavailable.' });
  }
});

module.exports = router;

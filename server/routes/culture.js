const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { CULTURE_SYSTEM_PROMPT } = require('../prompts/culture');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: CULTURE_SYSTEM_PROMPT,
    });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();
    const hasVerdict = text.includes('[VERDICT]');

    res.json({
      agent: 'culture',
      model: 'Gemini 1.5 Flash (Google)',
      message: text,
      hasVerdict,
    });
  } catch (error) {
    console.error('Culture agent error:', error.message);
    res.status(500).json({ error: 'The Culture Lead is temporarily unavailable.' });
  }
});

module.exports = router;

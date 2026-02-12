require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const architectRoute = require('./routes/architect');
const operatorRoute = require('./routes/operator');
const cultureRoute = require('./routes/culture');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Agent API routes
app.use('/api/architect', architectRoute);
app.use('/api/operator', operatorRoute);
app.use('/api/culture', cultureRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    agents: {
      architect: !!process.env.ANTHROPIC_API_KEY,
      operator: !!process.env.OPENAI_API_KEY,
      culture: !!process.env.GEMINI_API_KEY,
    },
  });
});

// SPA fallback — serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`TheBench server running on port ${PORT}`);
  console.log(`Agents configured:`);
  console.log(`  Architect (Claude): ${process.env.ANTHROPIC_API_KEY ? 'Ready' : 'Missing API key'}`);
  console.log(`  Operator (GPT-4o): ${process.env.OPENAI_API_KEY ? 'Ready' : 'Missing API key'}`);
  console.log(`  Culture (Gemini):   ${process.env.GEMINI_API_KEY ? 'Ready' : 'Missing API key'}`);
});

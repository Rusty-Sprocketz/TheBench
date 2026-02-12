const Anthropic = require('@anthropic-ai/sdk').default;

const APP_TYPES = [
  {
    type: 'ai-micro-tool',
    variants: [
      { name: 'Haiku Generator', desc: 'User enters a topic, AI writes a haiku' },
      { name: 'Emoji Translator', desc: 'User enters text, AI translates to emoji story' },
      { name: 'ELI5 Explainer', desc: 'User enters a concept, AI explains like they are 5' },
      { name: 'Fortune Teller', desc: 'User enters their name, AI gives a mystical fortune' },
    ],
  },
  {
    type: 'text-transformer',
    variants: [
      { name: 'Word Frequency Counter', desc: 'User enters text, see word frequency breakdown' },
      { name: 'Reading Time Estimator', desc: 'User enters text, get reading time and stats' },
      { name: 'Text Statistics Dashboard', desc: 'User enters text, see character/word/sentence counts' },
    ],
  },
  {
    type: 'utility-calculator',
    variants: [
      { name: 'Color Contrast Checker', desc: 'User enters two colors, check WCAG compliance' },
      { name: 'Password Strength Analyzer', desc: 'User enters password, get strength analysis' },
      { name: 'JSON Formatter', desc: 'User enters JSON, get formatted and validated output' },
    ],
  },
];

const THEMES = [
  { name: 'Midnight Garden', palette: ['#0f172a', '#1e293b', '#7c3aed', '#a78bfa', '#e2e8f0'], font: 'system-ui' },
  { name: 'Ocean Breeze', palette: ['#0c1222', '#162032', '#0ea5e9', '#38bdf8', '#e0f2fe'], font: 'system-ui' },
  { name: 'Sunset Mesa', palette: ['#1a0f0a', '#2d1810', '#ea580c', '#fb923c', '#fff7ed'], font: 'system-ui' },
  { name: 'Northern Lights', palette: ['#0a1628', '#0f2440', '#06b6d4', '#22d3ee', '#ecfeff'], font: 'system-ui' },
  { name: 'Forest Canopy', palette: ['#0a1a0f', '#132b1a', '#16a34a', '#4ade80', '#f0fdf4'], font: 'system-ui' },
  { name: 'Neon Arcade', palette: ['#0a0a0a', '#1a1a2e', '#e11d48', '#fb7185', '#fff1f2'], font: 'monospace' },
];

const SYSTEM_PROMPT = `You are the Architect Agent in a live AI pipeline demo. Your job is to pick an app type, variant, and theme, then produce a detailed specification.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences. Just the raw JSON object.

The JSON must follow this exact schema:
{
  "appType": "ai-micro-tool" | "text-transformer" | "utility-calculator",
  "variant": { "name": "string", "desc": "string" },
  "theme": { "name": "string", "palette": ["bg-dark", "bg-card", "accent", "accent-light", "text"], "font": "string" },
  "title": "string — creative app title",
  "tagline": "string — one-line description",
  "apiContract": {
    "endpoint": "/api/generate",
    "method": "POST",
    "requestBody": { "field_name": "field_type" },
    "responseBody": { "field_name": "field_type" }
  },
  "uiSpec": {
    "inputLabel": "string",
    "inputPlaceholder": "string",
    "submitButtonText": "string",
    "outputLabel": "string"
  },
  "architectNotes": "string — 2-3 sentences explaining your design choices"
}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    const { seed } = req.body;

    // Pick random options to suggest to the AI
    const typeGroup = APP_TYPES[Math.floor(Math.random() * APP_TYPES.length)];
    const variant = typeGroup.variants[Math.floor(Math.random() * typeGroup.variants.length)];
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    const userPrompt = `Design an app with these parameters (you may adjust creatively):
- App type: ${typeGroup.type}
- Suggested variant: ${variant.name} — ${variant.desc}
- Suggested theme: ${theme.name} with palette ${JSON.stringify(theme.palette)} and font ${theme.font}
- Random seed: ${seed || Math.random().toString(36).slice(2)}

Pick the variant and theme (or creatively modify them), then produce the full spec JSON.`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].text;
    let spec;
    try {
      spec = JSON.parse(text);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        spec = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Architect did not return valid JSON');
      }
    }

    // Validate required fields
    const required = ['appType', 'variant', 'theme', 'title', 'tagline', 'apiContract', 'uiSpec'];
    for (const field of required) {
      if (!spec[field]) {
        throw new Error(`Architect spec missing required field: ${field}`);
      }
    }

    res.json({
      stage: 'architect',
      spec,
      duration: 0, // Client will track actual duration
    });
  } catch (error) {
    console.error('Architect agent error:', error.message);
    res.status(500).json({ error: 'Architect agent failed', detail: error.message });
  }
};

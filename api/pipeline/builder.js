const Anthropic = require('@anthropic-ai/sdk').default;

const SYSTEM_PROMPT = `You are the Builder Agent in a live AI pipeline demo. You receive an Architect's spec and must generate ALL files for a deployable Vercel app.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences. Just the raw JSON object.

The JSON must follow this exact schema:
{
  "files": {
    "index.html": "string — complete HTML file",
    "styles.css": "string — complete CSS file",
    "app.js": "string — complete frontend JS",
    "api/generate.js": "string — Vercel serverless function",
    "vercel.json": "string — Vercel config JSON",
    "package.json": "string — package.json JSON"
  },
  "builderNotes": "string — 2-3 sentences about implementation decisions"
}

CRITICAL RULES:
1. index.html must be a complete standalone HTML file that links to styles.css and app.js
2. index.html MUST include a "How I Was Built" panel section at the bottom with id="build-log-panel"
3. The build log panel should have a toggle button and show placeholder divs with ids: architect-log, builder-log, reviewer-log, tester-log, deployer-log
4. app.js must load build-log.json and populate those divs (the deploy step will create this file)
5. styles.css must implement the Architect's theme (colors, fonts, layout)
6. api/generate.js must be a valid Vercel serverless function (module.exports = async (req, res) => { ... })
7. For "ai-micro-tool" type apps, api/generate.js should use the Gemini API via @google/generative-ai
8. For "text-transformer" and "utility-calculator" types, api/generate.js should do real computation (no AI needed)
9. vercel.json must route /api/* to serverless functions and /* to index.html
10. package.json needs only the dependencies required by api/generate.js
11. All HTML must sanitize user input to prevent XSS
12. The app must be fully functional and visually polished
13. Use the EXACT color palette from the spec for CSS custom properties
14. Include a footer link: "Built by AI agents on <a href='https://the-bench.vercel.app/agentops'>The Bench</a>"`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    const { spec } = req.body;

    if (!spec) {
      return res.status(400).json({ error: 'Missing architect spec' });
    }

    const userPrompt = `Here is the Architect's spec. Generate all files for this app:

${JSON.stringify(spec, null, 2)}

Remember:
- For the theme, set CSS custom properties: --bg-dark, --bg-card, --accent, --accent-light, --text using the palette array [bg-dark, bg-card, accent, accent-light, text]
- The app must be fully functional
- api/generate.js is a Vercel serverless function${spec.appType === 'ai-micro-tool' ? `
- api/generate.js must use Gemini API: require("@google/generative-ai"), use process.env.GEMINI_API_KEY, model "gemini-2.0-flash"
- package.json must include "@google/generative-ai" as dependency` : `
- api/generate.js does pure computation (no external API needed)
- package.json can be minimal with no dependencies`}
- Include the "How I Was Built" panel with build-log.json loading
- Make it look professional and polished`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].text;
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Builder did not return valid JSON');
      }
    }

    // Validate required files
    const requiredFiles = ['index.html', 'styles.css', 'app.js', 'api/generate.js', 'vercel.json', 'package.json'];
    for (const file of requiredFiles) {
      if (!result.files || !result.files[file]) {
        throw new Error(`Builder output missing required file: ${file}`);
      }
    }

    res.json({
      stage: 'builder',
      files: result.files,
      builderNotes: result.builderNotes || '',
      fileCount: Object.keys(result.files).length,
    });
  } catch (error) {
    console.error('Builder agent error:', error.message);
    res.status(500).json({ error: 'Builder agent failed', detail: error.message });
  }
};

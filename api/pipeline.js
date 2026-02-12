/**
 * Consolidated pipeline API — single serverless function dispatching by ?action=
 * This avoids Vercel Hobby plan's 12 serverless function limit.
 */
const Anthropic = require('@anthropic-ai/sdk').default;
const OpenAI = require('openai').default;
const { GoogleGenerativeAI } = require('@google/generative-ai');

const VERCEL_API = 'https://api.vercel.com';
const PROJECT_PREFIX = 'bench-demo-';
const MAX_ACTIVE_PROJECTS = 3;
const RATE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

const rateLimitStore = {};

// ─── Helpers ───

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function parseJSON(text, label) {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error(`${label} did not return valid JSON`);
}

async function listDemoProjects(token, teamId) {
  const r = await fetch(`${VERCEL_API}/v9/projects?teamId=${teamId}&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Failed to list projects: ${r.status}`);
  const d = await r.json();
  return (d.projects || []).filter(p => p.name.startsWith(PROJECT_PREFIX));
}

async function deleteVercelProject(token, teamId, projectId) {
  const r = await fetch(`${VERCEL_API}/v9/projects/${projectId}?teamId=${teamId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok && r.status !== 404) console.error(`Failed to delete ${projectId}: ${r.status}`);
}

// ─── Actions ───

async function handlePreflight(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(500).json({ error: 'Vercel API not configured' });

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const now = Date.now();
  if (rateLimitStore[ip] && now - rateLimitStore[ip] < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - (now - rateLimitStore[ip])) / 1000);
    return res.status(429).json({ error: `Rate limited. Try again in ${Math.ceil(waitSec / 60)} minutes.`, retryAfterSeconds: waitSec });
  }

  const demoProjects = await listDemoProjects(token, teamId);
  const stale = demoProjects.filter(p => now - p.createdAt > MAX_AGE_MS);
  for (const p of stale) await deleteVercelProject(token, teamId, p.id);

  const active = demoProjects.filter(p => now - p.createdAt <= MAX_AGE_MS);
  if (active.length >= MAX_ACTIVE_PROJECTS) {
    return res.status(429).json({ error: `Too many active demos (${active.length}/${MAX_ACTIVE_PROJECTS}). Try again later.` });
  }

  const demoId = generateId();
  const projectName = `${PROJECT_PREFIX}${demoId}`;
  rateLimitStore[ip] = now;
  res.json({ projectName, targetUrl: `https://${projectName}.vercel.app`, demoId, activeProjects: active.length });
}

// ─── Architect ───

const APP_TYPES = [
  { type: 'ai-micro-tool', variants: [
    { name: 'Haiku Generator', desc: 'User enters a topic, AI writes a haiku' },
    { name: 'Emoji Translator', desc: 'User enters text, AI translates to emoji story' },
    { name: 'ELI5 Explainer', desc: 'User enters a concept, AI explains like they are 5' },
    { name: 'Fortune Teller', desc: 'User enters their name, AI gives a mystical fortune' },
  ]},
  { type: 'text-transformer', variants: [
    { name: 'Word Frequency Counter', desc: 'User enters text, see word frequency breakdown' },
    { name: 'Reading Time Estimator', desc: 'User enters text, get reading time and stats' },
    { name: 'Text Statistics Dashboard', desc: 'User enters text, see character/word/sentence counts' },
  ]},
  { type: 'utility-calculator', variants: [
    { name: 'Color Contrast Checker', desc: 'User enters two colors, check WCAG compliance' },
    { name: 'Password Strength Analyzer', desc: 'User enters password, get strength analysis' },
    { name: 'JSON Formatter', desc: 'User enters JSON, get formatted and validated output' },
  ]},
];

const THEMES = [
  { name: 'Midnight Garden', palette: ['#0f172a','#1e293b','#7c3aed','#a78bfa','#e2e8f0'], font: 'system-ui' },
  { name: 'Ocean Breeze', palette: ['#0c1222','#162032','#0ea5e9','#38bdf8','#e0f2fe'], font: 'system-ui' },
  { name: 'Sunset Mesa', palette: ['#1a0f0a','#2d1810','#ea580c','#fb923c','#fff7ed'], font: 'system-ui' },
  { name: 'Northern Lights', palette: ['#0a1628','#0f2440','#06b6d4','#22d3ee','#ecfeff'], font: 'system-ui' },
  { name: 'Forest Canopy', palette: ['#0a1a0f','#132b1a','#16a34a','#4ade80','#f0fdf4'], font: 'system-ui' },
  { name: 'Neon Arcade', palette: ['#0a0a0a','#1a1a2e','#e11d48','#fb7185','#fff1f2'], font: 'monospace' },
];

const ARCHITECT_SYSTEM = `You are the Architect Agent in a live AI pipeline demo. Your job is to pick an app type, variant, and theme, then produce a detailed specification.

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

async function handleArchitect(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' });

  const { seed } = req.body;
  const tg = APP_TYPES[Math.floor(Math.random() * APP_TYPES.length)];
  const variant = tg.variants[Math.floor(Math.random() * tg.variants.length)];
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929', max_tokens: 1024, system: ARCHITECT_SYSTEM,
    messages: [{ role: 'user', content: `Design an app with these parameters (you may adjust creatively):
- App type: ${tg.type}
- Suggested variant: ${variant.name} — ${variant.desc}
- Suggested theme: ${theme.name} with palette ${JSON.stringify(theme.palette)} and font ${theme.font}
- Random seed: ${seed || Math.random().toString(36).slice(2)}

Pick the variant and theme (or creatively modify them), then produce the full spec JSON.` }],
  });

  const spec = parseJSON(response.content[0].text, 'Architect');
  const required = ['appType','variant','theme','title','tagline','apiContract','uiSpec'];
  for (const f of required) if (!spec[f]) throw new Error(`Architect spec missing: ${f}`);

  res.json({ stage: 'architect', spec, duration: 0 });
}

// ─── Builder ───

const BUILDER_SYSTEM = `You are the Builder Agent in a live AI pipeline demo. You receive an Architect's spec and must generate ALL files for a deployable Vercel app.

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

async function handleBuilder(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' });
  const { spec } = req.body;
  if (!spec) return res.status(400).json({ error: 'Missing architect spec' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929', max_tokens: 8192, system: BUILDER_SYSTEM,
    messages: [{ role: 'user', content: `Here is the Architect's spec. Generate all files for this app:

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
- Make it look professional and polished` }],
  });

  const result = parseJSON(response.content[0].text, 'Builder');
  const requiredFiles = ['index.html','styles.css','app.js','api/generate.js','vercel.json','package.json'];
  for (const f of requiredFiles) if (!result.files?.[f]) throw new Error(`Builder missing file: ${f}`);

  res.json({ stage: 'builder', files: result.files, builderNotes: result.builderNotes || '', fileCount: Object.keys(result.files).length });
}

// ─── Reviewer ───

const REVIEWER_SYSTEM = `You are the Reviewer Agent in a live AI pipeline demo. You review code generated by the Builder against the Architect's spec.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences. Just the raw JSON object.

The JSON must follow this exact schema:
{
  "overallVerdict": "pass" | "fail",
  "score": number (1-10),
  "items": [
    {
      "file": "string — filename",
      "status": "pass" | "warning" | "fail",
      "finding": "string — what was checked/found"
    }
  ],
  "summary": "string — 2-3 sentence overall assessment",
  "reviewerNotes": "string — brief notes about the review process"
}

Review these aspects:
1. Does the implementation match the Architect's API contract?
2. Are all required UI elements present (input, button, output area, build log panel)?
3. Is user input sanitized to prevent XSS?
4. Are there exposed API keys or secrets in frontend code?
5. Does the CSS use the specified theme colors?
6. Is the serverless function properly structured?
7. Does vercel.json have correct routing?
8. Basic accessibility (labels, semantic HTML)

Be thorough but fair. Real issues are warnings/fails. Working code is a pass.`;

async function handleReviewer(req, res) {
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI API key not configured' });
  const { spec, files } = req.body;
  if (!spec || !files) return res.status(400).json({ error: 'Missing spec or files' });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o', max_tokens: 2048,
    messages: [
      { role: 'system', content: REVIEWER_SYSTEM },
      { role: 'user', content: `Review this Builder output against the Architect's spec.

ARCHITECT SPEC:
${JSON.stringify(spec, null, 2)}

BUILDER FILES:
${Object.entries(files).map(([n, c]) => `--- ${n} ---\n${c}`).join('\n\n')}

Produce your review JSON.` },
    ],
  });

  const review = parseJSON(response.choices[0].message.content, 'Reviewer');
  if (!review.overallVerdict || !review.items) throw new Error('Reviewer output missing required fields');
  res.json({ stage: 'reviewer', review });
}

// ─── Tester ───

const TESTER_SYSTEM = `You are the Test Agent in a live AI pipeline demo. You generate and evaluate structural test assertions for code built by the Builder.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences. Just the raw JSON object.

The JSON must follow this exact schema:
{
  "totalTests": number,
  "passed": number,
  "failed": number,
  "tests": [
    {
      "name": "string — test name",
      "category": "structure" | "api" | "security" | "accessibility" | "theme",
      "status": "pass" | "fail",
      "detail": "string — what was checked and result"
    }
  ],
  "testerNotes": "string — 2-3 sentences about test coverage and findings"
}

Generate tests covering:
1. STRUCTURE: Required DOM elements exist (input, button, output area, build-log-panel)
2. API: Serverless function handles POST, returns expected response shape, handles errors
3. SECURITY: No exposed API keys in frontend code, input sanitization present
4. ACCESSIBILITY: Form labels exist, semantic HTML used, button has text
5. THEME: CSS custom properties defined matching the spec palette
6. ROUTING: vercel.json has correct rewrites for API and SPA

Evaluate each test by analyzing the actual code content. Be honest about pass/fail.`;

async function handleTester(req, res) {
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Gemini API key not configured' });
  const { spec, files } = req.body;
  if (!spec || !files) return res.status(400).json({ error: 'Missing spec or files' });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: TESTER_SYSTEM + '\n\n' + `Analyze this app and run structural tests.

ARCHITECT SPEC:
${JSON.stringify(spec, null, 2)}

BUILDER FILES:
${Object.entries(files).map(([n, c]) => `--- ${n} ---\n${c}`).join('\n\n')}

Generate your test results JSON.` }] }],
    generationConfig: { maxOutputTokens: 2048 },
  });

  const tests = parseJSON(result.response.text(), 'Tester');
  if (!tests.tests || !Array.isArray(tests.tests)) throw new Error('Tester output missing tests array');
  tests.totalTests = tests.tests.length;
  tests.passed = tests.tests.filter(t => t.status === 'pass').length;
  tests.failed = tests.tests.filter(t => t.status === 'fail').length;
  res.json({ stage: 'tester', tests });
}

// ─── Deployer ───

async function handleDeployer(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(500).json({ error: 'Vercel API not configured' });

  const { projectName, files, spec, buildLog } = req.body;
  if (!projectName || !files) return res.status(400).json({ error: 'Missing projectName or files' });

  const allFiles = { ...files, 'build-log.json': JSON.stringify(buildLog || {}, null, 2) };

  // Create project
  const projRes = await fetch(`${VERCEL_API}/v9/projects?teamId=${teamId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: projectName, framework: null }),
  });
  if (!projRes.ok) throw new Error(`Failed to create project: ${projRes.status} ${await projRes.text()}`);
  const project = await projRes.json();

  // Set env vars for AI-powered apps
  if (spec?.appType === 'ai-micro-tool' && process.env.GEMINI_API_KEY) {
    await fetch(`${VERCEL_API}/v10/projects/${project.id}/env?teamId=${teamId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY, type: 'encrypted', target: ['production','preview'] }]),
    });
  }

  // Deploy
  const fileEntries = Object.entries(allFiles).map(([file, data]) => ({ file, data }));
  const depRes = await fetch(`${VERCEL_API}/v13/deployments?teamId=${teamId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: projectName, files: fileEntries, projectSettings: { framework: null }, target: 'production' }),
  });
  if (!depRes.ok) throw new Error(`Failed to deploy: ${depRes.status} ${await depRes.text()}`);
  const deployment = await depRes.json();

  // Poll until ready
  for (let i = 0; i < 30; i++) {
    const pr = await fetch(`${VERCEL_API}/v13/deployments/${deployment.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!pr.ok) throw new Error(`Failed to check deployment: ${pr.status}`);
    const d = await pr.json();
    const state = d.readyState || d.state;
    if (state === 'READY') {
      return res.json({ stage: 'deployer', url: `https://${d.url || `${projectName}.vercel.app`}`, projectId: project.id, deploymentId: deployment.id, projectName, createdAt: Date.now() });
    }
    if (state === 'ERROR' || state === 'CANCELED') throw new Error(`Deployment ${state}: ${d.errorMessage || 'unknown'}`);
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Deployment timed out');
}

// ─── Check URL ───

async function handleCheckUrl(req, res) {
  const { url } = req.query;
  if (!url || !url.startsWith('https://')) return res.status(400).json({ error: 'Invalid URL' });
  if (!url.includes('bench-demo-') && !url.includes('.vercel.app')) return res.status(400).json({ error: 'URL not allowed' });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);
    res.json({ url, status: response.status, ok: response.ok });
  } catch (error) {
    res.json({ url, status: 0, ok: false, error: error.name === 'AbortError' ? 'timeout' : error.message });
  }
}

// ─── Cleanup ───

async function handleCleanup(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(500).json({ error: 'Vercel API not configured' });

  const { projectName } = req.body;
  if (!projectName || !projectName.startsWith('bench-demo-')) return res.status(400).json({ error: 'Invalid project name' });

  const projRes = await fetch(`${VERCEL_API}/v9/projects/${projectName}?teamId=${teamId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (projRes.status === 404) return res.json({ deleted: false, reason: 'Already cleaned up' });
  if (!projRes.ok) throw new Error(`Failed to find project: ${projRes.status}`);

  const project = await projRes.json();
  const delRes = await fetch(`${VERCEL_API}/v9/projects/${project.id}?teamId=${teamId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
  if (!delRes.ok && delRes.status !== 404) throw new Error(`Failed to delete: ${delRes.status}`);
  res.json({ deleted: true, projectName });
}

// ─── Cron Cleanup ───

async function handleCronCleanup(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(500).json({ error: 'Vercel API not configured' });

  const demoProjects = await listDemoProjects(token, teamId);
  const now = Date.now();
  let deleted = 0;

  for (const p of demoProjects) {
    if (now - p.createdAt > MAX_AGE_MS) {
      await deleteVercelProject(token, teamId, p.id);
      deleted++;
    }
  }

  res.json({ checked: demoProjects.length, deleted, timestamp: new Date().toISOString() });
}

// ─── Router ───

const ACTIONS = {
  preflight: handlePreflight,
  architect: handleArchitect,
  builder: handleBuilder,
  reviewer: handleReviewer,
  tester: handleTester,
  deployer: handleDeployer,
  'check-url': handleCheckUrl,
  cleanup: handleCleanup,
  'cron-cleanup': handleCronCleanup,
};

module.exports = async (req, res) => {
  const action = req.query.action;

  if (!action || !ACTIONS[action]) {
    return res.status(400).json({ error: `Unknown action: ${action}. Valid: ${Object.keys(ACTIONS).join(', ')}` });
  }

  try {
    await ACTIONS[action](req, res);
  } catch (error) {
    console.error(`Pipeline ${action} error:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `${action} failed`, detail: error.message });
    }
  }
};

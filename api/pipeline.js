/**
 * Consolidated pipeline API — single serverless function dispatching by ?action=
 * This avoids Vercel Hobby plan's 12 serverless function limit.
 */
const Anthropic = require('@anthropic-ai/sdk').default;
const OpenAI = require('openai').default;
const { GoogleGenerativeAI } = require('@google/generative-ai');

const VERCEL_API = 'https://api.vercel.com';
const PROJECT_PREFIX = 'bench-demo-';
const MAX_ACTIVE_PROJECTS = 6;
const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 minutes (reduced for testing)
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

const rateLimitStore = {};
let variantIndex = 2; // Start at ELI5 (skip Haiku=0, Emoji=1 — already tested)

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

// ─── Deterministic Contract Tests ───

function runContractTests(spec, files) {
  const tests = [];
  const appJs = files['app.js'] || '';
  const apiJs = files['api/generate.js'] || '';
  const reqFields = Object.keys(spec.apiContract?.requestBody || {});
  const resFields = Object.keys(spec.apiContract?.responseBody || {});

  // Check fetch URL
  tests.push({
    name: 'Fetch URL matches /api/generate',
    category: 'contract',
    status: appJs.includes('/api/generate') ? 'pass' : 'fail',
    detail: appJs.includes('/api/generate')
      ? 'app.js contains fetch to /api/generate'
      : 'app.js does NOT contain "/api/generate" — the fetch URL is wrong or missing',
  });

  // Check each request field appears in app.js (frontend sends correct fields)
  for (const field of reqFields) {
    const found = appJs.includes(field);
    tests.push({
      name: `Frontend sends request field "${field}"`,
      category: 'contract',
      status: found ? 'pass' : 'fail',
      detail: found
        ? `app.js references request field "${field}"`
        : `app.js does NOT contain "${field}" but spec.apiContract.requestBody expects it — frontend sends wrong field name`,
    });
  }

  // Check each response field appears in api/generate.js (backend returns correct fields)
  for (const field of resFields) {
    const found = apiJs.includes(field);
    tests.push({
      name: `Backend returns response field "${field}"`,
      category: 'contract',
      status: found ? 'pass' : 'fail',
      detail: found
        ? `api/generate.js references response field "${field}"`
        : `api/generate.js does NOT contain "${field}" but spec.apiContract.responseBody expects it — backend returns wrong field name`,
    });
  }

  // Check each response field is read in app.js (frontend reads correct response fields)
  for (const field of resFields) {
    const found = appJs.includes(field);
    tests.push({
      name: `Frontend reads response field "${field}"`,
      category: 'contract',
      status: found ? 'pass' : 'fail',
      detail: found
        ? `app.js references response field "${field}"`
        : `app.js does NOT contain "${field}" but spec.apiContract.responseBody expects it — frontend reads wrong field name from response`,
    });
  }

  // Check error handling
  tests.push({
    name: 'Frontend checks response.ok before parsing',
    category: 'contract',
    status: (appJs.includes('.ok') || appJs.includes('response.ok')) ? 'pass' : 'fail',
    detail: (appJs.includes('.ok') || appJs.includes('response.ok'))
      ? 'app.js checks response.ok before parsing JSON'
      : 'app.js does NOT check response.ok — error responses (HTML) will crash JSON parsing',
  });

  // Check vercel.json uses rewrites (not legacy routes which break serverless functions)
  const vercelJson = files['vercel.json'] || '';
  const usesRoutes = vercelJson.includes('"routes"');
  const usesRewrites = vercelJson.includes('"rewrites"');
  tests.push({
    name: 'vercel.json uses rewrites (not legacy routes)',
    category: 'contract',
    status: (!usesRoutes && usesRewrites) ? 'pass' : usesRoutes ? 'fail' : 'pass',
    detail: usesRoutes
      ? 'vercel.json uses legacy "routes" format which can prevent serverless functions from working — must use "rewrites" instead'
      : 'vercel.json uses modern "rewrites" format',
  });

  return tests;
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

  // Flatten all variants into a sequential list and cycle through them
  const allVariants = APP_TYPES.flatMap(tg => tg.variants.map(v => ({ type: tg.type, variant: v })));
  const pick = allVariants[variantIndex % allVariants.length];
  variantIndex++;
  const tg = { type: pick.type };
  const variant = pick.variant;
  const theme = THEMES[variantIndex % THEMES.length];

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
4. app.js must read build log data from window.__BUILD_LOG__ (a global set by an inline script injected at deploy time). Do NOT fetch build-log.json. Use: const buildLog = window.__BUILD_LOG__ || {};
   IMPORTANT: Each buildLog section (architect, builder, reviewer, tester, deployer) is a JSON OBJECT, not a string. You MUST format them for display. Use this exact pattern for each panel div:
   - architect-log: Show buildLog.architect.spec.title, buildLog.architect.spec.tagline, and buildLog.architect.notes. Format as readable HTML paragraphs.
   - builder-log: Show buildLog.builder.fileCount + " files generated", list buildLog.builder.fileNames (it's an array), and buildLog.builder.notes.
   - reviewer-log: Show buildLog.reviewer.overallVerdict, buildLog.reviewer.score, and loop through buildLog.reviewer.items array showing each item's file, status, and finding.
   - tester-log: Show buildLog.tester.passed + "/" + buildLog.tester.totalTests + " tests passed", loop through buildLog.tester.tests array showing each test name and status.
   - deployer-log: Show buildLog.deployer.projectName, buildLog.deployer.deployedAt, and buildLog.deployer.pipelineDuration.
   NEVER use .textContent = someObject or .innerHTML = someObject directly. Always extract specific string/number properties or use JSON.stringify(obj, null, 2) wrapped in a <pre> tag as a fallback. If a section is missing, show "Data not available".
5. styles.css must implement the Architect's theme (colors, fonts, layout)
6. api/generate.js must be a valid Vercel serverless function (module.exports = async (req, res) => { ... })
7. For "ai-micro-tool" type apps, api/generate.js MUST use this exact Gemini pattern:
   const { GoogleGenerativeAI } = require("@google/generative-ai");
   module.exports = async (req, res) => {
     try {
       const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
       const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
       // ... read fields from req.body ...
       const result = await model.generateContent("your prompt here");
       const text = result.response.text();
       res.json({ /* response fields matching apiContract.responseBody */ });
     } catch (err) {
       res.status(500).json({ error: err.message || "Generation failed" });
     }
   };
   The response extraction MUST be: result.response.text() — not result.text, not result.response.candidates, not anything else.
   The function MUST have a try/catch that returns a JSON error response on failure.
8. For "text-transformer" and "utility-calculator" types, api/generate.js should do real computation (no AI needed). It MUST still have try/catch with JSON error response.
9. vercel.json must route /api/* to serverless functions and /* to index.html
10. package.json needs only the dependencies required by api/generate.js
11. All HTML must sanitize user input to prevent XSS
12. The app must be fully functional and visually polished
13. Use the EXACT color palette from the spec for CSS custom properties
14. Include a footer link: "Built by AI agents on <a href='https://the-bench.vercel.app/agentops'>The Bench</a>"
15. The main app feature MUST work. The fetch call in app.js must use the correct URL ("/api/generate"), send the right field names matching apiContract.requestBody, and read the correct field names from the response matching apiContract.responseBody. Double-check these match exactly.
16. CRITICAL fetch error handling in app.js: After calling fetch(), you MUST check response.ok before calling response.json(). If !response.ok, read the body as text first, then try to parse it as JSON in a try/catch. Show a user-friendly error message in the output area (e.g. "Something went wrong — please try again."). NEVER call response.json() without checking response.ok first, because error responses may return HTML (not JSON) which causes "Unexpected token" crashes.`;

async function handleBuilder(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' });
  const { spec } = req.body;
  if (!spec) return res.status(400).json({ error: 'Missing architect spec' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929', max_tokens: 16384, system: BUILDER_SYSTEM,
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
- The "How I Was Built" panel reads from window.__BUILD_LOG__ (NOT a fetch to build-log.json)
- Make it look professional and polished
- CRITICAL: Make sure the fetch URL in app.js is exactly "/api/generate" and the request/response field names match the spec's apiContract exactly` }],
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

const TESTER_SYSTEM = `You are the Test Agent in a live AI pipeline demo. You must rigorously test code built by the Builder by analyzing the actual source code for bugs and issues.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences. Just the raw JSON object.

The JSON must follow this exact schema:
{
  "totalTests": number,
  "passed": number,
  "failed": number,
  "tests": [
    {
      "name": "string — test name",
      "category": "structure" | "api" | "security" | "accessibility" | "theme" | "logic",
      "status": "pass" | "fail",
      "detail": "string — what was checked and result"
    }
  ],
  "testerNotes": "string — 2-3 sentences about test coverage and findings"
}

CRITICAL: You must CAREFULLY trace through the code logic to find real bugs. Common issues to catch:

LOGIC TESTS (most important — trace through the code carefully):
1. Does app.js call fetch("/api/generate", ...) with the EXACT field names from the spec's apiContract.requestBody? List the field names in the fetch body and compare to the spec. FAIL if they don't match.
2. Does app.js read the EXACT field names from the API response matching the spec's apiContract.responseBody? List what the frontend reads vs what the backend returns. FAIL if they don't match.
3. Does api/generate.js return res.json({...}) with field names matching apiContract.responseBody? FAIL if it returns different field names.
4. For AI-powered apps: Does api/generate.js correctly use: const { GoogleGenerativeAI } = require("@google/generative-ai"); new GoogleGenerativeAI(process.env.GEMINI_API_KEY); model.generateContent(...)? Check the response is extracted correctly (result.response.text()). FAIL on any mistake.
5. For computation apps: Trace through the algorithm with the sample input "hello world". Does it produce a reasonable result? FAIL if the logic has a bug.
6. Does error handling work? If the API call fails, does app.js show an error message instead of crashing? Does api/generate.js have try/catch and return error JSON?
7. Does app.js read build log from window.__BUILD_LOG__ (NOT fetch build-log.json)? FAIL if it tries to fetch a file.
8. BUILD LOG RENDERING: Does app.js format build log objects properly? Each buildLog section (architect, builder, reviewer, tester, deployer) is a nested OBJECT. Check that the code extracts specific properties (like buildLog.architect.spec.title, buildLog.builder.fileCount, buildLog.reviewer.items, etc.) rather than assigning an object directly to .textContent or .innerHTML. If any line does something like element.textContent = buildLog.architect or element.innerHTML = someObject (where someObject is not a string), FAIL — this produces "[object Object]" on screen.

STRUCTURAL TESTS:
8. Required DOM elements: input field, submit button, output area, build-log-panel
9. CSS custom properties defined matching the spec palette

API TESTS:
10. Serverless function exports correctly (module.exports = async (req, res) => {...})
11. Function checks req.method and handles POST
12. Function returns JSON via res.json()

ROUTING:
13. vercel.json has correct rewrites for API and SPA fallback

For each FAIL, describe the exact bug: which file, which section, what's wrong, and what it should be instead. Be specific enough that a developer could fix it from your description alone.`;

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

  // Append deterministic contract tests to LLM results
  const contractTests = runContractTests(spec, files);
  tests.tests = [...tests.tests, ...contractTests];
  tests.totalTests = tests.tests.length;
  tests.passed = tests.tests.filter(t => t.status === 'pass').length;
  tests.failed = tests.tests.filter(t => t.status === 'fail').length;
  res.json({ stage: 'tester', tests });
}

// ─── Fixer (Builder fix pass) ───

const FIXER_SYSTEM = `You are the Builder Agent doing a FIX PASS. The Tester found bugs in your code. You must fix ONLY the failing tests while keeping everything else intact.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences. Just the raw JSON object.

The JSON must follow this exact schema:
{
  "files": {
    "filename": "string — complete fixed file content"
  },
  "fixNotes": "string — what you fixed and why"
}

RULES:
1. Only include files that need changes. Unchanged files should NOT be in the output.
2. When you include a file, include the COMPLETE file content (not a diff).
3. Fix every failing test the Tester identified. Read their detailed descriptions carefully.
4. Do NOT change the overall app design, theme, or structure — only fix the bugs.
5. Pay special attention to: mismatched API field names, incorrect fetch URLs, broken JSON parsing, incorrect Gemini API usage.
6. Build log data comes from window.__BUILD_LOG__ (injected at deploy time). Do NOT fetch build-log.json.
7. The fetch URL for the app's main action MUST be "/api/generate" and field names MUST match the spec's apiContract exactly.
8. Build log sections are OBJECTS, not strings. Never assign an object directly to .textContent or .innerHTML — this produces "[object Object]". Extract specific properties (e.g. buildLog.architect.spec.title, buildLog.builder.fileCount, buildLog.reviewer.items) and format them as HTML strings.`;

async function handleFixer(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' });
  const { spec, files, testResults, smokeTestFailure } = req.body;
  if (!spec || !files) return res.status(400).json({ error: 'Missing spec or files' });
  if (!testResults && !smokeTestFailure) return res.status(400).json({ error: 'Missing testResults or smokeTestFailure' });

  let failurePrompt;
  if (smokeTestFailure) {
    // Post-deploy smoke test failure — build detailed failure context
    const reason = smokeTestFailure.reason || 'unknown';
    let failureDetail = `The app was deployed but the smoke test FAILED.\n\nSMOKE TEST RESULT:\n- Failure reason: ${reason}\n- HTTP Status: ${smokeTestFailure.httpStatus || 'unknown'}`;

    if (reason === 'response_validation') {
      failureDetail += `\n- Missing response fields: ${JSON.stringify(smokeTestFailure.missingFields || [])}`;
      failureDetail += `\n- Empty response fields: ${JSON.stringify(smokeTestFailure.emptyFields || [])}`;
      failureDetail += `\n- Actual fields in response: ${JSON.stringify(smokeTestFailure.actualFields || [])}`;
      failureDetail += `\n- Response body: ${smokeTestFailure.body || 'unknown'}`;
      failureDetail += `\n\nThe API returned 200 but the response fields don't match the spec. Fix api/generate.js to return the exact field names from spec.apiContract.responseBody: ${JSON.stringify(Object.keys(spec.apiContract?.responseBody || {}))}`;
    } else if (reason === 'page_load') {
      failureDetail += `\n\nThe HTML page at / failed to load. Check index.html is valid.`;
    } else {
      failureDetail += `\n- Response body: ${smokeTestFailure.body || smokeTestFailure.error || 'unknown'}`;
      failureDetail += `\n\nThis means api/generate.js crashes or returns an error at runtime. Common causes:
- Wrong Gemini API usage (incorrect imports, wrong model ID, wrong response extraction)
- Missing try/catch in the serverless function
- Incorrect module.exports format
- Response not sent via res.json()`;
    }

    failureDetail += `\n\nThe correct Gemini pattern is:
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent("prompt");
  const text = result.response.text();`;

    failurePrompt = failureDetail;
  } else {
    const failedTests = testResults.tests.filter(t => t.status === 'fail');
    if (failedTests.length === 0) return res.json({ stage: 'fixer', files, fixNotes: 'No fixes needed' });
    failurePrompt = `FAILING TESTS:\n${failedTests.map((t, i) => `${i + 1}. [${t.category}] ${t.name}: ${t.detail}`).join('\n')}`;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929', max_tokens: 16384, system: FIXER_SYSTEM,
    messages: [{ role: 'user', content: `Fix the issues in this app.

ARCHITECT SPEC:
${JSON.stringify(spec, null, 2)}

CURRENT FILES:
${Object.entries(files).map(([n, c]) => `--- ${n} ---\n${c}`).join('\n\n')}

${failurePrompt}

Return ONLY the files that need changes, with their complete fixed content.` }],
  });

  const result = parseJSON(response.content[0].text, 'Fixer');
  if (!result.files) throw new Error('Fixer output missing files');

  // Merge fixed files into the full file set
  const mergedFiles = { ...files, ...result.files };

  res.json({ stage: 'fixer', files: mergedFiles, fixNotes: result.fixNotes || '', fixedCount: Object.keys(result.files).length });
}

// ─── Deployer ───

async function handleDeployer(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(500).json({ error: 'Vercel API not configured' });

  const { projectName, files, spec, buildLog } = req.body;
  if (!projectName || !files) return res.status(400).json({ error: 'Missing projectName or files' });

  // Inject build log as inline script into index.html (avoids routing issues with separate JSON file)
  const buildLogScript = `<script>window.__BUILD_LOG__=${JSON.stringify(buildLog || {})};</script>`;
  const html = files['index.html'] || '';
  const injectedHtml = html.includes('</head>')
    ? html.replace('</head>', `${buildLogScript}</head>`)
    : html.includes('</body>')
      ? html.replace('</body>', `${buildLogScript}</body>`)
      : html + buildLogScript;

  // Override vercel.json with a known-good config — Builder-generated configs often use
  // legacy "routes" format which prevents Vercel from recognizing api/*.js as serverless functions
  const VERIFIED_VERCEL_JSON = JSON.stringify({
    rewrites: [
      { source: "/((?!api/).*)", destination: "/index.html" }
    ]
  });

  const allFiles = { ...files, 'index.html': injectedHtml, 'vercel.json': VERIFIED_VERCEL_JSON };

  // Step 1: Create project (or reuse if it already exists from a previous failed attempt)
  let project;
  const projRes = await fetch(`${VERCEL_API}/v9/projects?teamId=${teamId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: projectName, framework: null, buildCommand: '', outputDirectory: '.' }),
  });
  if (projRes.status === 409) {
    // Project already exists (e.g. retry after failed deploy) — fetch it
    const existRes = await fetch(`${VERCEL_API}/v9/projects/${projectName}?teamId=${teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!existRes.ok) throw new Error(`Failed to fetch existing project: ${existRes.status}`);
    project = await existRes.json();
  } else if (!projRes.ok) {
    throw new Error(`Failed to create project: ${projRes.status} ${await projRes.text()}`);
  } else {
    project = await projRes.json();
  }

  // Step 2: Disable Deployment Protection so the app is publicly accessible
  await fetch(`${VERCEL_API}/v9/projects/${project.id}?teamId=${teamId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passwordProtection: null,
      ssoProtection: null,
      vercelAuthentication: { deploymentType: 'none' },
    }),
  });

  // Step 3: Set env vars for AI-powered apps
  if (spec?.appType === 'ai-micro-tool' && process.env.GEMINI_API_KEY) {
    await fetch(`${VERCEL_API}/v10/projects/${project.id}/env?teamId=${teamId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY, type: 'encrypted', target: ['production','preview'] }]),
    });
  }

  // Step 4: Deploy
  const fileEntries = Object.entries(allFiles).map(([file, data]) => ({ file, data }));
  const depRes = await fetch(`${VERCEL_API}/v13/deployments?teamId=${teamId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: projectName, files: fileEntries, projectSettings: { framework: null, buildCommand: '', outputDirectory: '.' }, target: 'production' }),
  });
  if (!depRes.ok) throw new Error(`Failed to deploy: ${depRes.status} ${await depRes.text()}`);
  const deployment = await depRes.json();

  // Step 5: Poll until ready
  for (let i = 0; i < 30; i++) {
    const pr = await fetch(`${VERCEL_API}/v13/deployments/${deployment.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!pr.ok) throw new Error(`Failed to check deployment: ${pr.status}`);
    const d = await pr.json();
    const state = d.readyState || d.state;
    if (state === 'READY') {
      // Step 6: Explicitly alias to the clean project URL
      const aliasUrl = `${projectName}.vercel.app`;
      await fetch(`${VERCEL_API}/v2/deployments/${deployment.id}/aliases?teamId=${teamId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: aliasUrl }),
      });

      const finalUrl = `https://${aliasUrl}`;

      // Step 7: Smoke test — hit the app's API to verify the action button works
      // Uses retry logic to handle Vercel alias propagation delays (404s on fresh deploys)
      let smokeTest = { status: 'skipped' };
      if (spec?.apiContract) {
        const testPayload = {};
        const reqBody = spec.apiContract.requestBody || {};
        for (const [key, type] of Object.entries(reqBody)) {
          if (type === 'string' || type.includes('string')) testPayload[key] = 'hello world test';
          else if (type === 'number' || type.includes('number')) testPayload[key] = 42;
          else testPayload[key] = 'test';
        }

        const SMOKE_RETRIES = 3;
        const SMOKE_DELAY_MS = [5000, 4000, 3000]; // initial wait + retry delays

        for (let attempt = 0; attempt < SMOKE_RETRIES; attempt++) {
          await new Promise(r => setTimeout(r, SMOKE_DELAY_MS[attempt]));

          try {
            const smokeRes = await fetch(`${finalUrl}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(testPayload),
            });

            const smokeBody = await smokeRes.text();
            let smokeJson;
            try { smokeJson = JSON.parse(smokeBody); } catch { smokeJson = null; }

            // 404 or network-level errors on early attempts are likely alias propagation — retry
            if (smokeRes.status === 404 && attempt < SMOKE_RETRIES - 1) {
              smokeTest = { status: 'fail', reason: 'http_error', httpStatus: 404, body: smokeBody.slice(0, 500), retryable: true };
              continue;
            }

            if (smokeRes.ok && smokeJson) {
              // Verify expected response fields exist and are non-empty
              const expectedFields = Object.keys(spec.apiContract?.responseBody || {});
              const missingFields = expectedFields.filter(f => !(f in smokeJson));
              const emptyFields = expectedFields.filter(f =>
                f in smokeJson && (smokeJson[f] === null || smokeJson[f] === '')
              );

              if (missingFields.length > 0 || emptyFields.length > 0) {
                smokeTest = {
                  status: 'fail', reason: 'response_validation',
                  httpStatus: smokeRes.status, missingFields, emptyFields,
                  actualFields: Object.keys(smokeJson),
                  body: smokeBody.slice(0, 500),
                };
              } else {
                smokeTest = { status: 'pass', httpStatus: smokeRes.status, response: smokeJson };
              }
            } else {
              smokeTest = { status: 'fail', reason: 'http_error', httpStatus: smokeRes.status, body: smokeBody.slice(0, 500) };
            }

            // Also verify the HTML page loads
            if (smokeTest.status === 'pass') {
              const pageRes = await fetch(finalUrl);
              if (!pageRes.ok) {
                smokeTest = { status: 'fail', reason: 'page_load', httpStatus: pageRes.status };
              }
            }

            break; // Got a definitive result (pass or real failure), stop retrying
          } catch (err) {
            if (attempt < SMOKE_RETRIES - 1) {
              smokeTest = { status: 'fail', reason: 'network_error', error: err.message, retryable: true };
              continue;
            }
            smokeTest = { status: 'fail', reason: 'network_error', error: err.message };
          }
        }
      }

      return res.json({ stage: 'deployer', url: finalUrl, projectId: project.id, deploymentId: deployment.id, projectName, createdAt: Date.now(), smokeTest });
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
  fixer: handleFixer,
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

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are the Test Agent in a live AI pipeline demo. You generate and evaluate structural test assertions for code built by the Builder.

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const { spec, files } = req.body;

    if (!spec || !files) {
      return res.status(400).json({ error: 'Missing spec or files' });
    }

    const userPrompt = `Analyze this app and run structural tests.

ARCHITECT SPEC:
${JSON.stringify(spec, null, 2)}

BUILDER FILES:
${Object.entries(files).map(([name, content]) => `--- ${name} ---\n${content}`).join('\n\n')}

Generate your test results JSON.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
    });

    const text = result.response.text();
    let tests;
    try {
      tests = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tests = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Tester did not return valid JSON');
      }
    }

    // Validate required fields
    if (!tests.tests || !Array.isArray(tests.tests)) {
      throw new Error('Tester output missing tests array');
    }

    // Recalculate counts from actual data
    tests.totalTests = tests.tests.length;
    tests.passed = tests.tests.filter(t => t.status === 'pass').length;
    tests.failed = tests.tests.filter(t => t.status === 'fail').length;

    res.json({
      stage: 'tester',
      tests,
    });
  } catch (error) {
    console.error('Tester agent error:', error.message);
    res.status(500).json({ error: 'Tester agent failed', detail: error.message });
  }
};

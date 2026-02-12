const VERCEL_API = 'https://api.vercel.com';
const PROJECT_PREFIX = 'bench-demo-';
const MAX_ACTIVE_PROJECTS = 3;
const RATE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

// In-memory rate limit store (resets on cold start, which is fine for serverless)
const rateLimitStore = {};

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function listDemoProjects(token, teamId) {
  const url = `${VERCEL_API}/v9/projects?teamId=${teamId}&limit=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to list projects: ${res.status}`);
  }
  const data = await res.json();
  return (data.projects || []).filter(p => p.name.startsWith(PROJECT_PREFIX));
}

async function deleteProject(token, teamId, projectId) {
  const url = `${VERCEL_API}/v9/projects/${projectId}?teamId=${teamId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    console.error(`Failed to delete project ${projectId}: ${res.status}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !teamId) {
    return res.status(500).json({ error: 'Vercel API not configured' });
  }

  // Rate limiting by IP
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const now = Date.now();
  if (rateLimitStore[ip] && now - rateLimitStore[ip] < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - (now - rateLimitStore[ip])) / 1000);
    return res.status(429).json({
      error: `Rate limited. Try again in ${Math.ceil(waitSec / 60)} minutes.`,
      retryAfterSeconds: waitSec,
    });
  }

  try {
    // List existing demo projects
    const demoProjects = await listDemoProjects(token, teamId);

    // Lazy cleanup: delete projects older than 1 hour
    const stale = demoProjects.filter(p => now - p.createdAt > MAX_AGE_MS);
    for (const p of stale) {
      await deleteProject(token, teamId, p.id);
    }

    // Check active project count (after cleanup)
    const active = demoProjects.filter(p => now - p.createdAt <= MAX_AGE_MS);
    if (active.length >= MAX_ACTIVE_PROJECTS) {
      return res.status(429).json({
        error: `Too many active demos (${active.length}/${MAX_ACTIVE_PROJECTS}). Try again later.`,
      });
    }

    // Generate target project name and URL
    const demoId = generateId();
    const projectName = `${PROJECT_PREFIX}${demoId}`;
    const targetUrl = `https://${projectName}.vercel.app`;

    // Record rate limit
    rateLimitStore[ip] = now;

    res.json({
      projectName,
      targetUrl,
      demoId,
      activeProjects: active.length,
    });
  } catch (error) {
    console.error('Preflight error:', error.message);
    res.status(500).json({ error: 'Preflight check failed', detail: error.message });
  }
};

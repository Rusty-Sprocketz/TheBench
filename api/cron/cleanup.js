const VERCEL_API = 'https://api.vercel.com';
const PROJECT_PREFIX = 'bench-demo-';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

module.exports = async (req, res) => {
  // Vercel cron sends GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !teamId) {
    return res.status(500).json({ error: 'Vercel API not configured' });
  }

  try {
    // List all demo projects
    const listRes = await fetch(
      `${VERCEL_API}/v9/projects?teamId=${teamId}&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!listRes.ok) {
      throw new Error(`Failed to list projects: ${listRes.status}`);
    }

    const data = await listRes.json();
    const demoProjects = (data.projects || []).filter(p =>
      p.name.startsWith(PROJECT_PREFIX)
    );

    const now = Date.now();
    let deleted = 0;

    for (const project of demoProjects) {
      if (now - project.createdAt > MAX_AGE_MS) {
        const delRes = await fetch(
          `${VERCEL_API}/v9/projects/${project.id}?teamId=${teamId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (delRes.ok || delRes.status === 404) {
          deleted++;
        } else {
          console.error(`Failed to delete ${project.name}: ${delRes.status}`);
        }
      }
    }

    res.json({
      checked: demoProjects.length,
      deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron cleanup error:', error.message);
    res.status(500).json({ error: 'Cron cleanup failed', detail: error.message });
  }
};

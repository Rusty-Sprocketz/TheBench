const VERCEL_API = 'https://api.vercel.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !teamId) {
    return res.status(500).json({ error: 'Vercel API not configured' });
  }

  try {
    const { projectName } = req.body;

    if (!projectName || !projectName.startsWith('bench-demo-')) {
      return res.status(400).json({ error: 'Invalid project name' });
    }

    // Find and delete the project
    const projectRes = await fetch(
      `${VERCEL_API}/v9/projects/${projectName}?teamId=${teamId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (projectRes.status === 404) {
      return res.json({ deleted: false, reason: 'Project not found (already cleaned up)' });
    }

    if (!projectRes.ok) {
      throw new Error(`Failed to find project: ${projectRes.status}`);
    }

    const project = await projectRes.json();

    const deleteRes = await fetch(
      `${VERCEL_API}/v9/projects/${project.id}?teamId=${teamId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!deleteRes.ok && deleteRes.status !== 404) {
      throw new Error(`Failed to delete project: ${deleteRes.status}`);
    }

    res.json({ deleted: true, projectName });
  } catch (error) {
    console.error('Cleanup error:', error.message);
    res.status(500).json({ error: 'Cleanup failed', detail: error.message });
  }
};

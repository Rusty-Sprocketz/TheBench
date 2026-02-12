const VERCEL_API = 'https://api.vercel.com';

async function createProject(token, teamId, projectName) {
  const res = await fetch(`${VERCEL_API}/v9/projects?teamId=${teamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      framework: null,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create project: ${res.status} ${body}`);
  }

  return res.json();
}

async function createDeployment(token, teamId, projectName, files, envVars) {
  // Convert files object to Vercel deployment format
  const fileEntries = Object.entries(files).map(([path, content]) => ({
    file: path,
    data: content,
  }));

  const res = await fetch(`${VERCEL_API}/v13/deployments?teamId=${teamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      files: fileEntries,
      projectSettings: {
        framework: null,
      },
      target: 'production',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create deployment: ${res.status} ${body}`);
  }

  return res.json();
}

async function pollDeployment(token, deploymentId, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to check deployment: ${res.status}`);
    }

    const deployment = await res.json();
    const state = deployment.readyState || deployment.state;

    if (state === 'READY') {
      return deployment;
    }
    if (state === 'ERROR' || state === 'CANCELED') {
      throw new Error(`Deployment ${state}: ${deployment.errorMessage || 'unknown error'}`);
    }

    // Wait 2 seconds between polls
    await new Promise(r => setTimeout(r, 2000));
  }

  throw new Error('Deployment timed out');
}

async function setEnvVars(token, teamId, projectId, envVars) {
  // Set environment variables on the project
  const envArray = Object.entries(envVars).map(([key, value]) => ({
    key,
    value,
    type: 'encrypted',
    target: ['production', 'preview'],
  }));

  const res = await fetch(`${VERCEL_API}/v10/projects/${projectId}/env?teamId=${teamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envArray),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Failed to set env vars: ${res.status} ${body}`);
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

  try {
    const { projectName, files, spec, buildLog } = req.body;

    if (!projectName || !files) {
      return res.status(400).json({ error: 'Missing projectName or files' });
    }

    // Add build-log.json to the files
    const allFiles = {
      ...files,
      'build-log.json': JSON.stringify(buildLog || {}, null, 2),
    };

    // Step 1: Create project
    const project = await createProject(token, teamId, projectName);

    // Step 2: Set environment variables if the app needs Gemini
    if (spec && spec.appType === 'ai-micro-tool' && process.env.GEMINI_API_KEY) {
      await setEnvVars(token, teamId, project.id, {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      });
    }

    // Step 3: Create deployment
    const deployment = await createDeployment(token, teamId, projectName, allFiles);

    // Step 4: Poll until ready
    const readyDeployment = await pollDeployment(token, deployment.id);

    const deployedUrl = `https://${readyDeployment.url || `${projectName}.vercel.app`}`;

    res.json({
      stage: 'deployer',
      url: deployedUrl,
      projectId: project.id,
      deploymentId: deployment.id,
      projectName,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Deployer agent error:', error.message);
    res.status(500).json({ error: 'Deployer agent failed', detail: error.message });
  }
};

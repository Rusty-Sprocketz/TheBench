const API_BASE = '/api/pipeline';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.detail = data.detail;
    err.retryAfterSeconds = data.retryAfterSeconds;
    throw err;
  }

  return data;
}

export async function preflight() {
  return fetchJSON(`${API_BASE}/preflight`, { method: 'POST' });
}

export async function runArchitect(seed) {
  return fetchJSON(`${API_BASE}/architect`, {
    method: 'POST',
    body: JSON.stringify({ seed }),
  });
}

export async function runBuilder(spec) {
  return fetchJSON(`${API_BASE}/builder`, {
    method: 'POST',
    body: JSON.stringify({ spec }),
  });
}

export async function runReviewer(spec, files) {
  return fetchJSON(`${API_BASE}/reviewer`, {
    method: 'POST',
    body: JSON.stringify({ spec, files }),
  });
}

export async function runTester(spec, files) {
  return fetchJSON(`${API_BASE}/tester`, {
    method: 'POST',
    body: JSON.stringify({ spec, files }),
  });
}

export async function runDeployer(projectName, files, spec, buildLog) {
  return fetchJSON(`${API_BASE}/deployer`, {
    method: 'POST',
    body: JSON.stringify({ projectName, files, spec, buildLog }),
  });
}

export async function checkUrl(url) {
  return fetchJSON(`${API_BASE}/check-url?url=${encodeURIComponent(url)}`);
}

export async function cleanup(projectName) {
  return fetchJSON(`${API_BASE}/cleanup`, {
    method: 'POST',
    body: JSON.stringify({ projectName }),
  });
}

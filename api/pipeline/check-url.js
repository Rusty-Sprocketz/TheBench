module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Only allow checking bench-demo-* or vercel.app URLs
  if (!url.includes('bench-demo-') && !url.includes('.vercel.app')) {
    return res.status(400).json({ error: 'URL not allowed' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    res.json({
      url,
      status: response.status,
      ok: response.ok,
    });
  } catch (error) {
    // Connection refused, timeout, DNS failure = not live yet
    res.json({
      url,
      status: 0,
      ok: false,
      error: error.name === 'AbortError' ? 'timeout' : error.message,
    });
  }
};

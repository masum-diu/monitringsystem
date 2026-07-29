const DEFAULT_TIMEOUT_MS = 15000;

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
  'Cache-Control': 'no-cache',
};

/** @param {number} status */
function classifyResponse(status) {
  if (status >= 200 && status < 400) {
    return { ok: true, error: null };
  }
  // Server answered but blocked the monitor (common on Cloudflare / WAF from datacenter IPs).
  if (status === 403 || status === 401) {
    return {
      ok: true,
      error:
        'Protected (HTTP ' +
        status +
        ') — blocks automated checks from Vercel; site often works in a normal browser.',
    };
  }
  return { ok: false, error: `HTTP ${status}` };
}

/**
 * @param {{ name: string, url: string }} site
 * @param {number} timeoutMs
 */
export async function checkSite(site, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(site.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });

    const ms = Date.now() - started;
    const { ok, error } = classifyResponse(response.status);

    return {
      name: site.name,
      url: site.url,
      ok,
      status: response.status,
      ms,
      error,
      protected: response.status === 403 || response.status === 401,
    };
  } catch (err) {
    const ms = Date.now() - started;
    const message =
      err.name === 'AbortError' ? 'Request timed out' : err.message || 'Request failed';

    return {
      name: site.name,
      url: site.url,
      ok: false,
      status: null,
      ms,
      error: message,
      protected: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{ name: string, url: string }[]} sites
 */
export async function checkAllSites(sites) {
  const results = await Promise.all(sites.map((site) => checkSite(site)));
  const failed = results.filter((r) => !r.ok);
  const allOk = failed.length === 0;
  return { results, allOk, failed };
}

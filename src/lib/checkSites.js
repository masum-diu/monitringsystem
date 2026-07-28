const DEFAULT_TIMEOUT_MS = 15000;

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
      headers: {
        'User-Agent': 'monitringsystem/1.0 (+https://vercel.com)',
      },
    });

    const ms = Date.now() - started;
    const ok = response.status >= 200 && response.status < 400;

    return {
      name: site.name,
      url: site.url,
      ok,
      status: response.status,
      ms,
      error: ok ? null : `HTTP ${response.status}`,
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
  return { results, allOk: failed.length === 0, failed };
}

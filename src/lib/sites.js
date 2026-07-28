import sitesFile from '../../monitor-sites.json';

/**
 * Sites from MONITOR_SITES env (JSON array) override monitor-sites.json.
 * @returns {{ name: string, url: string }[]}
 */
export function getMonitorSites() {
  const raw = process.env.MONITOR_SITES;
  if (raw && raw.trim()) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('MONITOR_SITES must be a non-empty JSON array');
    }
    for (const s of parsed) {
      if (!s.name || !s.url) {
        throw new Error('Each site needs "name" and "url"');
      }
    }
    return parsed;
  }
  return sitesFile;
}

# Site Monitor (Vercel)

Automatic uptime checks + email alerts.

**No `.env.local` required for deploy.** All secrets live in **Vercel Environment Variables** + **GitHub Repository secret** `CRON_SECRET`.

Production URL: https://monitringsystem-inks.vercel.app

## Deploy checklist

1. **`monitor-sites.json`** — site list (committed in repo).
2. **Vercel** → Settings → Environment Variables (Production) — copy from `.env.example`:
   - `CRON_SECRET`, `RESEND_API_KEY`, `MONITOR_EMAIL_FROM`, `MONITOR_EMAIL_TO`
   - optional: `MONITOR_TIMEZONE`, `MONITOR_HOURS`
3. **Redeploy** after env changes.
4. **GitHub** → Settings → Secrets → Actions → **Repository secrets**:
   - `CRON_SECRET` (same value as Vercel)
5. Push repo; workflow `.github/workflows/site-monitor.yml` calls the app twice daily.

## Schedule

**10:00** and **18:00** Asia/Dhaka via GitHub Actions (Hobby-friendly). Manual: `?force=1`.

## Test production

```bash
curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://monitringsystem-inks.vercel.app/api/cron/monitor?force=1"
```

## Local dev (optional)

`.env.local` is gitignored and **not** deployed. Vercel injects env at runtime.

Optional local scripts (export vars or use `.env.local` if you want):

```bash
node scripts/check-local.mjs
npm run email:demo
```

## Email subjects

| Result | Subject |
|--------|---------|
| All OK | `[OK] Site monitor — all sites healthy` |
| Any down | `[ALERT] Site monitor — N site(s) down` |

## Optional env

- `MONITOR_SITES` — JSON array overrides `monitor-sites.json`
- `MONITOR_HOURS` — default `10,18`

## `my-agent` (Eve)

Not used for this monitor; deploy **repo root** only.

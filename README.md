# Site Monitor (Vercel)

Automatic uptime checks + email alerts. Best fit for **many sites, fixed times, no AI agent**.

## Schedule

Default: **10:00** and **18:00** in `MONITOR_TIMEZONE` (default `Asia/Dhaka`).

Manual test anytime: `?force=1`.

### Vercel Hobby vs Pro

| Plan | Scheduling |
|------|------------|
| **Hobby** | Vercel Cron is limited (often **once per day**). This repo uses **`vercel.json` with empty `crons`** and **GitHub Actions** for twice-daily checks (free). |
| **Pro** | You can add Vercel crons instead, e.g. `0 4 * * *` and `0 12 * * *` UTC for 10:00 / 18:00 Dhaka. |

### GitHub Actions (Hobby — recommended)

1. Push repo to **GitHub** and connect Vercel to it.
2. GitHub repo → **Settings → Secrets and variables → Actions**:
   - `MONITOR_URL` = `https://YOUR-PROJECT.vercel.app` (no trailing slash)
   - `CRON_SECRET` = same as Vercel env
3. Workflow file: `.github/workflows/site-monitor.yml` (runs 04:00 & 12:00 UTC daily).
4. **Actions** tab → **Site monitor** → **Run workflow** to test once.

Vercel env vars still required (`RESEND_*`, `MONITOR_EMAIL_*`, `CRON_SECRET`).

## Quick setup

1. Edit **`monitor-sites.json`** — your real site names and URLs.
2. [Resend](https://resend.com): API key + verified sender domain.
3. Vercel env vars (see `.env.example`):
   - `CRON_SECRET`, `RESEND_API_KEY`, `MONITOR_EMAIL_FROM`, `MONITOR_EMAIL_TO`
4. Deploy this repo to Vercel (not the `my-agent` Eve folder).

## Test after deploy

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://YOUR_APP.vercel.app/api/cron/monitor?force=1"
```

## Email

| Result | Subject |
|--------|---------|
| All OK | `[OK] Site monitor — all sites healthy` |
| Any down | `[ALERT] Site monitor — N site(s) down` |

## Optional env

- `MONITOR_SITES` — JSON array (overrides `monitor-sites.json`)
- `MONITOR_HOURS` — e.g. `10,18`
- `MONITOR_TIMEZONE` — e.g. `America/New_York` for US sites

## Eve (`my-agent`)

Separate experiment; needs **Node 24** and is not required for scheduled monitoring. Use this Next.js app for production alerts.

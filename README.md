# Site Monitor (Vercel)

Automatic uptime checks + email alerts. Best fit for **many sites, fixed times, no AI agent**.

## Schedule

Default: **10:00** and **18:00** in `MONITOR_TIMEZONE` (default `Asia/Dhaka`).

Vercel runs one cron every hour (`0 * * * *` UTC); the API only checks and sends mail at those local hours. Manual test anytime: `?force=1`.

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

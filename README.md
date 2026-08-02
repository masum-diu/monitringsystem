# Site Monitor (Vercel)

Automatic uptime checks + **WhatsApp alerts only** (email disabled).

**No `.env.local` required for deploy.** All secrets live in **Vercel Environment Variables** + **GitHub Repository secret** `CRON_SECRET`.

Production URL: https://monitringsystem-inks.vercel.app

## Deploy checklist

1. **`monitor-sites.json`** — site list (committed in repo).
2. **Vercel** → Settings → Environment Variables (Production) — copy from `.env.example`:
   - `CRON_SECRET`, `GREEN_API_*`, `WHATSAPP_GROUP_NAME` (EtherTech)
   - optional: `MONITOR_TIMEZONE`, `WHATSAPP_ALERT_ONLY`
3. **Redeploy** after env changes.
4. **GitHub** → Settings → Secrets → Actions → **Repository secrets**:
   - `CRON_SECRET` (same value as Vercel)
5. Push repo; workflow `.github/workflows/site-monitor.yml` calls the app twice daily.

## Schedule

**Every 3 hours** via GitHub Actions (`0 */3 * * *` UTC — 8× daily). Manual: `?force=1`.

## Test production

```bash
curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://monitringsystem-inks.vercel.app/api/cron/monitor?force=1"
```

## Local dev (optional)

`.env.local` is gitignored and **not** deployed. Vercel injects env at runtime.

1. Copy `.env.example` → `.env.local` and fill Green API + Resend values.
2. Run:

```bash
npm run check:local      # sites only (no email/WhatsApp)
npm run monitor:local    # full: check + email + WhatsApp
npm run email:demo       # check + email only
npm run whatsapp:test    # fake alert → EtherTech group
npm run whatsapp:chats -- "EtherTech"

npm run dev              # API test:
curl -H "Authorization: Bearer YOUR_CRON_SECRET" "http://localhost:3000/api/cron/monitor?force=1"
```

## WhatsApp setup (Green API — **group**)

1. **Account:** [green-api.com](https://green-api.com) → sign up → create instance.
2. **Link phone:** Console → QR code scan (একটা spare WhatsApp number ব্যবহার করুন — bot হিসেবে group-এ add হবে).
3. **Group:** WhatsApp group-এ সেই bot number add করুন (Admin → Add participants).
4. **Group chat ID** (either way works):
   - **Easy:** `WHATSAPP_GROUP_NAME=EtherTech` — app finds the group automatically, **or**
   - **Fixed ID:** `npm run whatsapp:chats -- "EtherTech"` → copy `WHATSAPP_CHAT_ID`
5. **Vercel env** (Production):

   | Variable | Example |
   |----------|---------|
   | `WHATSAPP_PROVIDER` | `greenapi` |
   | `GREEN_API_URL` | `https://7105.api.greenapi.com` (console থেকে copy) |
   | `GREEN_API_INSTANCE_ID` | `7105123456` |
   | `GREEN_API_TOKEN` | `abc123…` |
   | `WHATSAPP_GROUP_NAME` | `EtherTech` |
   | `WHATSAPP_ALERT_ONLY` | `false` — **default:** প্রতি ৩ ঘণ্টায় WhatsApp (OK + alert) |

**Default (`WHATSAPP_ALERT_ONLY` unset or `false`):**
- প্রতি ৩ ঘণ্টায় site check + **WhatsApp message** EtherTech group-এ
- সব OK হলে `[OK]` message, down হলে `[ALERT]` message

**শুধু down হলে WhatsApp চাইলে:** Vercel-এ `WHATSAPP_ALERT_ONLY=true`

6. **Redeploy** Vercel → test:
   ```bash
   npm run whatsapp:test
   ```
   অথবা production cron: `?force=1`

### WhatsApp setup (CallMeBot — **personal**, free)

1. [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/) → phone register → API key নিন।
2. Vercel: `WHATSAPP_PROVIDER=callmebot`, `CALLMEBOT_PHONE=8801…`, `CALLMEBOT_APIKEY=…`
3. Group support নেই — শুধু আপনার নম্বরে message যাবে।

## Email subjects

| Result | Subject |
|--------|---------|
| All OK | `[OK] Site monitor — all sites healthy` |
| Any down | `[ALERT] Site monitor — N site(s) down` |

## Optional env

- `MONITOR_SITES` — JSON array overrides `monitor-sites.json`
- `MONITOR_HOURS` — default `10,18`
- `WHATSAPP_ALERT_ONLY=true` — WhatsApp শুধু site down হলে; default প্রতি check-এ WhatsApp

## `my-agent` (Eve)

Not used for this monitor; deploy **repo root** only.

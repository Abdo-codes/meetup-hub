# Environment configuration

## Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Captcha (Cloudflare Turnstile)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public widget key; embedded at build time
- `TURNSTILE_SECRET_KEY` — server-only Siteverify secret

Both values are required for voting. The vote endpoint fails closed when either
the widget or server verification is unavailable. In Cloudflare, restrict the
widget to every hostname that serves the app, including deploy-preview hosts
that need voting enabled. Never expose `TURNSTILE_SECRET_KEY` to the browser.

## Admin access
- `ADMIN_EMAILS` (comma‑separated) — server‑only
- `NEXT_PUBLIC_ADMIN_EMAILS` (legacy; avoid in prod)

## Notes
- `NEXT_PUBLIC_*` values are exposed to the client

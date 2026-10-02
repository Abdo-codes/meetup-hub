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
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; used by authenticated admin routes

## Notes
- `NEXT_PUBLIC_*` values are exposed to the client
- Never prefix the Supabase service-role key with `NEXT_PUBLIC_` or expose it to browser code

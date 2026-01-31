# Environment configuration

## Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Captcha (Cloudflare Turnstile)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Admin access
- `ADMIN_EMAILS` (comma‑separated) — server‑only
- `NEXT_PUBLIC_ADMIN_EMAILS` (legacy; avoid in prod)

## Notes
- `NEXT_PUBLIC_*` values are exposed to the client

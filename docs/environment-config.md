# Environment configuration

## Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Admin access
- `ADMIN_EMAILS` (comma‑separated) — server‑only
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; used by authenticated admin routes
- `NEXT_PUBLIC_ADMIN_EMAILS` (legacy; only controls the convenience link in existing clients)

## Notes
- `NEXT_PUBLIC_*` values are exposed to the client
- Never prefix the Supabase service-role key with `NEXT_PUBLIC_` or expose it to browser code

# Deployment

## Netlify (recommended)
- Uses `netlify.toml`
- Deploy from GitHub repo

## Vercel
- Standard Next.js deploy

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAILS` (preferred)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only admin database access)
- `NEXT_PUBLIC_SITE_URL`

## Notes / pitfalls
- Make sure env vars are set in hosting provider
- Admin navigation and API authorization both derive from the server-only `ADMIN_EMAILS` list
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never expose it through a `NEXT_PUBLIC_` variable

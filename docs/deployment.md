# Deployment

## Netlify (recommended)
- Uses `netlify.toml`
- Deploy from GitHub repo

## Vercel
- Standard Next.js deploy

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_EMAILS` (legacy)
- `ADMIN_EMAILS` (preferred)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only admin database access)
- `NEXT_PUBLIC_SITE_URL`

## Notes / pitfalls
- Make sure env vars are set in hosting provider
- For production, avoid `NEXT_PUBLIC_ADMIN_EMAILS` and use `ADMIN_EMAILS`
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never expose it through a `NEXT_PUBLIC_` variable

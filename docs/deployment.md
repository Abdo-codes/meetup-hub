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
- `NEXT_PUBLIC_SITE_URL`

## Notes / pitfalls
- Make sure env vars are set in hosting provider
- For production, avoid `NEXT_PUBLIC_ADMIN_EMAILS` and use `ADMIN_EMAILS`

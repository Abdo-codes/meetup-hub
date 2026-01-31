# Middleware & auth

## Middleware
- `src/middleware.ts` initializes Supabase SSR auth
- Ensures auth cookies are synced

## Auth flow
- OAuth via Supabase (GitHub/Google)
- `/join` triggers OAuth
- `/dashboard` reads session via Supabase client

## Notes / pitfalls
- Middleware runs on most routes; keep it light
- Avoid relying on Host header for auth checks

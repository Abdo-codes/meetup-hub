# Voting & clicks

## Purpose
Let the community upvote projects and track interest.

## Endpoints
- `POST /api/projects/[id]/vote`
- `POST /api/projects/[id]/click`

## Logic
- Vote: one per IP per month (via `project_votes`)
- Click: increments counter, awards 1 point

## Rate limits
- Vote: 5/min per IP+project
- Click: 20/min per IP+project

## Captcha
- Voting uses Cloudflare Turnstile (free)
- Requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`

## Notes / pitfalls
- IP-based voting is still spoofable; add per-user voting for stronger integrity
- Consider caching click increments if traffic grows

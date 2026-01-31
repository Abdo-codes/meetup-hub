# Improvements & enhancements (doc-based review)

This is a focused list of areas to improve, derived from the current docs and codebase.

## 1) Member onboarding
- **Server-side validation** for profile creation/updates (currently client‑only).
- **Consent/versioning**: store a terms version and join timestamp.
- **Slug collisions**: DB unique constraint exists, but add graceful UI error handling for conflicts.

## 2) Member dashboard
- **Project limit enforcement** is UI‑only; add DB/RLS enforcement to prevent API abuse.
- **Profile completeness** nudges (missing bio/socials/projects).
- **Points history pagination** (currently last 20 only).

## 3) Projects
- **Duplicate prevention**: already UI+DB index, but add clearer error message when DB constraint triggers.
- **Project edit flow** (currently add/delete only).
- **Project visibility** controls (draft/unlisted) for new members.

## 4) Voting & clicks
- **Integrity**: IP‑based voting is weak; add per‑user voting and/or captcha.
- **Rate limiting**: in‑memory only; move to Redis/Upstash for multi‑instance deployments.
- **Anti‑gaming**: cap votes/clicks per member per day or per project.

## 5) Points system
- **Visibility**: point transactions are public; consider restricting to member/admin.
- **Abuse controls**: cap max points/day from clicks or votes.
- **Explainability**: show rules on dashboard and leaderboard.

## 6) Admin workflow
- **Audit log** for approvals/rejections and point awards.
- **Moderation states**: add “rejected” with optional reason.
- **Role model**: migrate from email allowlist to roles table.

## 7) Data model & RLS
- **Policies**: review RLS in Supabase dashboard to ensure parity with schema file.
- **Constraints**: add CHECKs for handle fields (twitter/github/linkedin).
- **Soft deletes** for members/projects (optional).

## 8) SEO & content
- **Indexing control**: avoid indexing unapproved profiles explicitly.
- **Open Graph images**: per‑member OG image generation.

## 9) Deployment & ops
- **Env drift**: document required env vars in deployment guides and CI checks.
- **Observability**: integrate Sentry/Logtail for runtime errors.

---

## Suggested next steps (highest impact)
1) **Voting integrity** (per‑user + captcha + Redis rate limiting)
2) **Server‑side validation** + clearer error handling
3) **Admin audit log + moderation states**
4) **Points abuse caps**

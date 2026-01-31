# Member dashboard

## Purpose
Let members edit profiles, manage projects, and view points history.

## UI
- `src/app/dashboard/page.tsx`

## Key sections
- **Profile view/edit**
- **Projects list**
- **Points history** (last 20 transactions)

## Rules
- Max projects: 5 (front‑end enforcement)
- Project URLs must be valid
- Slug, handles, and URLs validated client‑side

## Notes / pitfalls
- Enforce limits in DB if you expect multi‑client usage
- Consider server‑side validation for profile edits

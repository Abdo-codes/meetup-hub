# Projects

## Purpose
Members can add and showcase projects with a title, URL, and optional description.

## Data
- `projects` table
- Unique constraint: `(member_id, url)`

## UI
- Project list rendered on member pages via `ProjectCard`
- Add/remove on dashboard

## Rules
- Title length max 80
- Description max 200
- URL required and validated
- Max 5 projects per member (UI)

## Notes / pitfalls
- Duplicate URLs blocked client‑side + DB index
- Consider limiting edits to approved members only if needed

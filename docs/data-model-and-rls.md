# Data model & RLS

## Schema
Defined in `supabase-schema.sql`.

### Core tables
- `members`
- `projects`
- `project_votes`
- `point_transactions`

### Constraints
- Slug format + bio length
- Project title/description length
- Unique `(member_id, url)`

## RLS policies
- Public can view approved members + their projects
- Members can view/update their own profiles/projects
- Admins can view/update/delete all members
- Project votes insert/select open (consider tightening)

## Notes / pitfalls
- IP‑based votes are weak; add per‑user voting + captcha
- Consider hiding point transactions if privacy is a concern

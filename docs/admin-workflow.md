# Admin workflow

## Purpose
Approve, reject, or revoke members with an audit trail, and award points.

## UI
- `src/app/admin/page.tsx`

## Actions
- Approve/reject/revoke a member via `PATCH /api/admin/members/:id`
- Delete a member via `DELETE /api/admin/members/:id`
- Award points via `POST /api/admin/points`

## Auth
- Admins are authenticated and validated server-side against `ADMIN_EMAILS`
- Moderation changes and their audit record are committed atomically by `moderate_member`

## Notes / pitfalls
- Configure `SUPABASE_SERVICE_ROLE_KEY` only on the server
- Apply `supabase/migrations/202608240001_member_moderation.sql` before deploying the admin UI

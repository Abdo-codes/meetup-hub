# Admin workflow

## Purpose
Approve members and award points.

## UI
- `src/app/admin/page.tsx`

## Actions
- Approve/revoke member (`members.is_approved`)
- Delete member
- Award points via `POST /api/admin/points`

## Auth
- Admins validated by email list (`ADMIN_EMAILS`)

## Notes / pitfalls
- Avoid using public env vars for admin list
- Consider audit log for approvals/rejections

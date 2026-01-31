# Member onboarding

## Purpose
Let new members sign in and create a profile that can be approved by admins.

## Flow
1. **Join page** (`src/app/join/page.tsx`)
   - OAuth sign-in via GitHub/Google
   - Redirects to `/dashboard`
2. **Dashboard (new user)** (`src/app/dashboard/page.tsx`)
   - If no member record, shows edit mode
   - User fills out profile and saves
3. **Approval** (`src/app/admin/page.tsx`)
   - Admin approves member by setting `is_approved`

## Data
- `members` table stores core profile fields
- `email` is used for auth mapping
- `slug` is used for public profile URLs

## Notes / pitfalls
- Slug must be unique and valid (client validation + DB constraint)
- Ensure OAuth provider has a name; otherwise require manual input

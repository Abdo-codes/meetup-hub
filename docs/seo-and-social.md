# SEO & social metadata

## Purpose
Ensure pages render correct metadata for sharing and search.

## Global metadata
- `src/app/layout.tsx`
  - `metadata` default title/description
  - Open Graph + Twitter card
  - `metadataBase` from `NEXT_PUBLIC_SITE_URL`
  - Icons and robots

## Per‑page metadata
- Member profiles: `src/app/m/[slug]/page.tsx` via `generateMetadata`
- Leaderboard: `src/app/leaderboard/page.tsx`

## Sitemap
- `src/app/sitemap.ts`

## Notes / pitfalls
- Ensure `NEXT_PUBLIC_SITE_URL` is set in prod
- For member pages, only approved profiles should be indexed

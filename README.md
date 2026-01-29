# Meetup Hub

A modern, open-source community hub for tech meetups. Showcase your members, their projects, and upcoming events.

## Features

- **Member Profiles** - Individual pages for each member with bio, social links, and projects
- **Project Showcase** - Monthly voting system to highlight top community projects
- **Event Listings** - Display upcoming meetups with Luma integration
- **Dark/Light Mode** - System-aware theme switching
- **QR Code Sharing** - Easy profile sharing for in-person events
- **Admin Dashboard** - Approve members, manage the community
- **SEO Optimized** - Dynamic meta tags, sitemap, Open Graph support
- **Fully Accessible** - Keyboard navigation, screen reader support

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/meetup-hub.git
cd meetup-hub
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema from `supabase-schema.sql` in the SQL editor
3. Enable GitHub and/or Google OAuth in Authentication > Providers

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_EMAILS=your@email.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Customize Your Meetup

Edit `src/data/meetup.ts`:
```ts
export const meetup = {
  name: "Your Meetup Name",
  tagline: "Your tagline here",
  description: "Description of your community...",
  links: {
    luma: "https://lu.ma/your-meetup",
    twitter: "https://twitter.com/your-handle",
    discord: "https://discord.gg/your-server",
    github: "https://github.com/your-org",
  },
};

export const events = [
  {
    title: "Your Event",
    date: "2025-03-01",
    time: "18:00",
    location: "Your Venue",
    lumaLink: "https://lu.ma/your-event",
  },
];
```

### 5. Run

```bash
npm run dev
```

## Deploy

### Netlify (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/meetup-hub)

Or via CLI:
```bash
netlify deploy --prod
```

### Vercel

```bash
vercel
```

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Supabase** - Database, Auth, and Row Level Security
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety

## License

MIT

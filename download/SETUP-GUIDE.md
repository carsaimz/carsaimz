# Carsai Mozambique — Setup & Testing Guide

## Quick Start

```bash
# 1. Extract the ZIP
unzip carsai-mozambique-project.zip

# 2. Install dependencies
bun install

# 3. Generate Prisma client
bun run db:generate

# 4. Seed the database (first run only)
# Visit http://localhost:3000/api/seed after starting the server

# 5. Start development server
bun run dev

# 6. Open in browser
http://localhost:3000/home
```

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| super_admin | carsaimozambique@gmail.com | Carnanda23 |
| admin | admin@carsai.mz | admin123 |
| partner | partner@carsai.mz | partner123 |
| user | user@carsai.mz | user123 |

## Key URLs

- Home: `/home`
- Services: `/services`
- Projects: `/projects`
- Blog: `/blog`
- Forum: `/forum`
- FAQ: `/faq`
- Contact: `/contact`
- About: `/about`
- Login/Register: `/auth`
- Admin Dashboard: `/admin`
- Partner Dashboard: `/partner`
- User Dashboard: `/user`

## Mobile Build (Capacitor)

```bash
# Static export for Capacitor
bun run export:clean

# Sync to Capacitor
bun run cap:sync

# Add Android platform
bun run cap:add:android

# Build Android
bun run cap:build:android
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Copy `.env.local.example` to `.env.local`
3. Fill in the 7 `NEXT_PUBLIC_FIREBASE_*` variables from Firebase project settings

## Build Modes

| Command | Mode | Output | Use |
|---------|------|--------|-----|
| `bun run build` | standalone | `.next/standalone` | Web server with API routes |
| `bun run export` | static export | `out` | Capacitor / mobile builds |
| `bun run export:clean` | static export (clean) | `out` | Fresh mobile build |

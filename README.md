# D4D Mission Control

Deal management platform for Doors For Dollars — a fix & flip real estate company in Pennsylvania.

## Features

- **Dashboard** — Pipeline visualization, deal stats, quick-add
- **Deal Pipeline** — Kanban board with drag-and-drop stage management
- **Deal Calculator** — Analyze deals with 70% rule, holding costs, ROI
- **Rehab Tracker** — Per-property budgets, line items, draw schedules
- **Lead Pipeline** — Multi-source lead tracking with scoring and conversion
- **Financials** — Deal P&L, period summaries, Ivan's 25% cut calculation
- **Team Activity** — Activity feed, task assignments, deal notes

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS (dark theme)
- Supabase (PostgreSQL)
- PWA (installable on phone)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd d4d-mission-control
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_PASSWORD=your-shared-password
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the same environment variables in your Vercel project settings.

## Authentication

Simple invite-code auth for the team:

| Name  | Role         | Default Code |
|-------|-------------|-------------|
| Ivan  | Dispositions | ivan2024    |
| Bryce | Acquisitions | bryce2024   |
| Jack  | Owner        | jack2024    |

The shared password (`NEXT_PUBLIC_APP_PASSWORD`) also works for any team member.

## PWA Installation

On mobile (Chrome/Safari):
1. Navigate to the deployed URL
2. Tap "Add to Home Screen"
3. The app works like a native app

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated app pages
│   │   ├── dashboard/
│   │   ├── deals/       # Kanban pipeline
│   │   ├── calculator/
│   │   ├── rehab/
│   │   ├── leads/
│   │   ├── financials/
│   │   └── activity/
│   ├── login/
│   ├── layout.tsx
│   └── page.tsx         # Redirect to dashboard/login
├── components/
│   └── Sidebar.tsx
└── lib/
    ├── auth.tsx         # Auth context
    ├── supabase.ts      # Supabase client
    └── types.ts         # TypeScript types & helpers
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

# Pathfinder UPMS — Complete (Phase 1 + Phase 2)

**Stack:** Next.js 14 (App Router) · Supabase · Tailwind CSS · TypeScript

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and fill in your Supabase project URL and anon key.
> Get these from: Supabase Dashboard → Your Project → Settings → API

### 3. Run database migrations
In the **Supabase SQL Editor**, run in order:
1. `supabase/migrations/001_phase1_schema.sql` — Full schema + RLS
2. `supabase/migrations/002_seed_events.sql` — Sample calendar events

Or via Supabase CLI:
```bash
supabase db push
```

### 4. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Phase 1 Routes

| Route | Description |
|---|---|
| `/` | Basecamp homepage — all 5 programs |
| `/cub-scouts` | Cub Scouts landing page |
| `/boy-scouts` | Boy Scouts landing page |
| `/rangers` | Rangers landing page |
| `/squadron` | Squadron landing page |
| `/shooting-club` | Cedar Sports Shooting Club landing page |
| `/calendar` | Mom Page — password-protected unified calendar |
| `/api/calendar/cub-scouts.ics` | iCal feed — Cub Scouts |
| `/api/calendar/boy-scouts.ics` | iCal feed — Boy Scouts |
| `/api/calendar/rangers.ics` | iCal feed — Rangers |
| `/api/calendar/squadron.ics` | iCal feed — Squadron |
| `/api/calendar/shooting-club.ics` | iCal feed — Shooting Club |
| `/api/calendar/all.ics` | iCal feed — All Programs |

---

## Key Files

```
src/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Homepage (Basecamp)
│   ├── calendar/page.tsx           # Mom Page calendar
│   ├── (public)/                   # 5 program landing pages
│   │   ├── cub-scouts/page.tsx
│   │   ├── boy-scouts/page.tsx
│   │   ├── rangers/page.tsx
│   │   ├── squadron/page.tsx
│   │   └── shooting-club/page.tsx
│   └── api/calendar/[program]/     # .ics feed routes
│       └── route.ts
├── components/
│   ├── layout/
│   │   ├── SiteNav.tsx             # Sticky nav + mobile menu
│   │   └── SiteFooter.tsx
│   └── ProgramPage.tsx             # Shared program landing template
├── lib/
│   ├── programs.ts                 # Single source of truth for all 5 programs
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       └── server.ts               # Server Component Supabase client
└── styles/
    └── globals.css                 # Tailwind + Pathfinder design tokens

supabase/migrations/
├── 001_phase1_schema.sql           # Full DB schema (all phases stubbed)
└── 002_seed_events.sql             # Sample calendar events
```

---

## Calendar Password
The default calendar password is `pathfinder2024`.

Change it by updating `NEXT_PUBLIC_CALENDAR_PASSWORD` in `.env.local`.
Passwords are per-household in Phase 2 when full auth is added.

---

## Phase 1 Exit Criteria Checklist

- [ ] All five program pages live at their routes
- [ ] Mom Page calendar loads events from Supabase behind password gate
- [ ] All six `.ics` feeds return valid iCal (test in Google Calendar)
- [ ] Mobile layout works at 375px viewport width
- [ ] Lighthouse mobile score ≥ 85

---

## Next: Phase 2 — Compliance & Onboarding
Phase 2 adds: Supabase Auth, household registration, youth member profiles, digital waivers, encrypted medical vault, and the admin dashboard.

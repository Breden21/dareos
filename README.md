# CORA (Prototype)

Role-based digital operations platform, piloting with Makoni Rural District
Council. Vite + React + TypeScript + Tailwind CSS, backed by Supabase
(Postgres, Auth, Row Level Security) for real authentication and data.
Responsive: a full sidebar/topbar desktop layout for the CEO role, and a
mobile-first app for field roles (collector, ward officer, driver, records
clerk). Installable as a PWA (see below).

## Accounts

Real login accounts live in Supabase Auth, with a matching `profiles` row
per user (role, name, ward/collection point/vehicle scope). There is no
hardcoded account list in the frontend anymore — see `src/lib/auth.ts` and
`src/screens/LoginScreen.tsx`. New staff accounts are provisioned via the
Supabase dashboard (Authentication → Add user), then a matching row is
inserted into `profiles`.

Each role sees a completely different app — different nav, different home
screen, scoped to only their own data via RLS policies at the database level.

## Project structure

```
cora/
├── src/
│   ├── components/
│   │   ├── ui/atoms.tsx          # Card (tone-tinted), Badge, IconChip, Delta, SectionHeader, BackRow
│   │   └── layout/
│   │       ├── Shell.tsx         # Mobile Header + BottomNav, desktop Topbar
│   │       └── Sidebar.tsx       # Desktop-only sidebar nav (CEO gets grouped sections)
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Email/password sign-in against Supabase Auth
│   │   ├── ProfileScreen.tsx     # Shared by restricted roles
│   │   ├── CeoDashboard.tsx      # District Briefing + revenue/ward/fleet summary, real data
│   │   ├── CollectorToday.tsx    # Guided step-by-step capture flow (fee type → amount → photo → GPS → submit → receipt number)
│   │   ├── CollectorHistory.tsx
│   │   ├── WardOfficerHome.tsx   # Scoped to the officer's own ward; logs/updates real service requests + asset condition
│   │   ├── DriverHome.tsx        # Scoped to the driver's one vehicle; real GPS + fuel/odometer updates
│   │   ├── RecordsScreen.tsx     # EFM: real capture, search, category progress
│   │   ├── WardScreen.tsx        # CEO's full cross-ward view + asset creation
│   │   ├── MoreScreen.tsx        # CEO's fleet + staff + council minutes, with real capture forms
│   │   └── revenue/
│   │       ├── RevenueScreen.tsx # tab strip wiring the 5 sub-views below
│   │       ├── OverviewSub.tsx   # month-on-month trend
│   │       ├── CollectionSub.tsx
│   │       ├── RatepayersSub.tsx # real data + capture form
│   │       ├── StandsSub.tsx     # real data + capture form
│   │       └── ReconcileSub.tsx
│   ├── lib/
│   │   ├── types.ts              # shared TS interfaces
│   │   ├── supabaseClient.ts     # Supabase client singleton (reads .env.local)
│   │   ├── auth.ts               # shared profile-fetching helper (login + session restore)
│   │   └── mockData.ts           # legacy reference only - all screens now read from Supabase
│   ├── App.tsx                   # auth state + role-based tab routing
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Design notes

- Palette: navy (`#052560`) + mint (`#2FBF95`), matching Info Impact
  Solutions' brand. Fraunces (headlines/big numbers) + Inter (body).
- Every status-bearing card carries a `tone` prop that tints its whole
  background (success/warn/danger/accent), not just a badge.
- Desktop (`lg:` breakpoint, 1024px+): CEO gets a persistent sidebar,
  a topbar, and multi-column dashboard panels (revenue trend chart via
  `recharts`, collections-by-ward ranking). Field roles stay single-column
  mobile-style even on a wide screen, since that's how they'd actually use it.
- Mobile: bottom tab bar, single column throughout.

## 1. Local setup (VS Code)

Requires [Node.js](https://nodejs.org) 18+ and npm.

```bash
cd rdcos-app
npm install     # once, needs internet
npm run dev     # prints a Network URL too - use that to test on your phone
```

Production build:

```bash
npm run build
npm run preview
```

## 2. Deploying to Vercel

**Via GitHub:** push the repo, then "Add New Project" on vercel.com and
import it — Vercel auto-detects Vite (`vite build`, output `dist`).

**Via CLI:**

```bash
npm install -g vercel
vercel login
vercel
```

## Notes

- Real authentication via Supabase Auth; role/scope data lives in the `profiles` table.
- Row Level Security policies, plus column-lock triggers on sensitive tables, enforce data scoping and prevent tampering at the database level, not just in the UI.
- Installable as a PWA (vite-plugin-pwa) - the app shell works offline, but all data actions still require connectivity; a real offline-capture-and-sync queue is future work.
- No self-serve staff account creation yet - new users are still provisioned via the Supabase dashboard + a `profiles` insert (see Accounts above).

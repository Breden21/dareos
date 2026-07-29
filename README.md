# Dare OS — Rural District Council Operating System (Prototype)

Role-based mock frontend for Mutasa Rural District Council. Vite + React +
TypeScript + Tailwind CSS. All data is mocked (`src/lib/mockData.ts`) — no
backend yet. Responsive: a full sidebar/topbar desktop layout for the CEO
role, and a mobile-first app for field roles (collector, ward officer,
driver, records clerk).

## Demo accounts

Shown as tappable cards on the login screen, or type them manually:

| Role | Email | Password |
|---|---|---|
| CEO | ceo@mutasa.rdc.gov.zw | ceo2026 |
| Revenue Collector | collector@mutasa.rdc.gov.zw | collect2026 |
| Ward Officer (Ward 7) | ward7@mutasa.rdc.gov.zw | ward2026 |
| Fleet Driver | driver@mutasa.rdc.gov.zw | drive2026 |
| Records Clerk | records@mutasa.rdc.gov.zw | records2026 |

Each role sees a completely different app — different nav, different home
screen, scoped to only their own data.

## Project structure

```
dare-os/
├── src/
│   ├── components/
│   │   ├── ui/atoms.tsx          # Card (tone-tinted), Badge, IconChip, Delta, SectionHeader, BackRow
│   │   └── layout/
│   │       ├── Shell.tsx         # Mobile Header + BottomNav, desktop Topbar
│   │       └── Sidebar.tsx       # Desktop-only sidebar nav (CEO gets grouped sections)
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Demo account picker
│   │   ├── ProfileScreen.tsx     # Shared by restricted roles
│   │   ├── CeoDashboard.tsx      # District Briefing + responsive chart/ward-ranking (desktop only)
│   │   ├── CollectorToday.tsx    # Guided step-by-step capture flow (fee type → amount → photo → GPS → submit)
│   │   ├── CollectorHistory.tsx
│   │   ├── WardOfficerHome.tsx   # Scoped to the officer's own ward
│   │   ├── DriverHome.tsx        # Scoped to the driver's one vehicle
│   │   ├── RecordsScreen.tsx     # Digitization tracker — used by CEO tab and Records Clerk home
│   │   ├── WardScreen.tsx        # CEO's full cross-ward view
│   │   ├── MoreScreen.tsx        # CEO's fleet + staff + minutes
│   │   └── revenue/
│   │       ├── RevenueScreen.tsx # tab strip wiring the 5 sub-views below
│   │       ├── OverviewSub.tsx
│   │       ├── CollectionSub.tsx
│   │       ├── RatepayersSub.tsx
│   │       ├── StandsSub.tsx
│   │       └── ReconcileSub.tsx
│   ├── lib/
│   │   ├── types.ts              # shared TS interfaces — future API contract
│   │   ├── accounts.ts           # demo login credentials
│   │   └── mockData.ts           # single seam to replace with real API calls later
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
cd dare-os
npm install     # once, needs internet
npm run dev     # localhost:5173 — works offline after install
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

- No real authentication — the 5 demo accounts above are hardcoded client-side.
- No backend — all data in `src/lib/mockData.ts`.
- No offline data persistence (PWA/service worker) yet.

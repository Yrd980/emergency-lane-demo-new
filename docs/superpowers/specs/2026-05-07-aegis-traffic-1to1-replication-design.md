# Aegis Traffic 1:1 Replication Design

## Source
`stitch_emergency_lane_sentinel/` — 4 reference HTML screens + DESIGN.md design system.

## Target
Existing React + TypeScript + Vite + Tailwind CSS v4 project. All pages, shell, and `.impeccable/design.json` rewritten to match references.

## Design System
- **Mode:** Dark-first (#13131b canvas)
- **Primary:** Neon Indigo (#c2c1ff / #5e5ce6)
- **Secondary:** Safety Orange (#ffb5a0 / #d73b00) — alerts only
- **Typography:** Inter (UI) + Space Grotesk (mono data)
- **Elevation:** Tonal layering + glassmorphism (80% opacity, 20px blur, 1px white/5% top border)
- **Icons:** Material Symbols Outlined (replace lucide-react)
- **Shapes:** 4px DEFAULT, 8px lg, 12px xl, full

## Architecture
No structural changes. Same routes, same data hooks, same API. Visual-only migration.

## Phase 1 — Foundation
- Rewrite `.impeccable/design.json`
- Update `index.css` @theme block
- Switch icons

## Phase 2 — Shell & Primitives
- Rebuild ProductShell (sidebar, topbar, bottom nav)
- Rebuild ProductPrimitives, StatusBadge, EmptyState, ErrorBanner

## Phase 3 — Main Pages
- Dashboard → web_1 (analytics with charts, hotspot ranking, operator leaderboard)
- EventDetail → web_2 (evidence gallery, AI recognition, timeline, action buttons)
- DeviceStatus → web_3 (camera feeds, incident log, sparklines)

## Phase 4 — Remaining Pages
- EventList, ReviewQueue, Settings, Setup, Health, DeviceDetail — Aegis theme

## Phase 5 — Android
- Rebuild to match android/code.html

## Phase 6 — Verify
- `bun run dev`, visual check, backend tests

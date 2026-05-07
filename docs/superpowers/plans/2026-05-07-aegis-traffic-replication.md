# Aegis Traffic 1:1 Replication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite all frontend pages, shell, shared components, and `.impeccable/design.json` to 1:1 match the Aegis Traffic dark-theme reference designs from `stitch_emergency_lane_sentinel/`.

**Architecture:** Same React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4 + react-router-dom v7 shell. No structural changes — routes, data hooks, API client stay. Visual-only migration: switch lucide-react → Material Symbols, apply Aegis dark theme palette/typography/spacing/elevation, rebuild each page's JSX to match reference HTML layout.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, react-router-dom v7, Material Symbols font (replaces lucide-react), Inter + Space Grotesk fonts

---

## File Structure Map

| File | Action | Responsibility |
|------|--------|----------------|
| `.impeccable/design.json` | Rewrite | Canonical Aegis Traffic design system |
| `frontend/index.html` | Modify | Already has Material Symbols + fonts |
| `frontend/src/index.css` | Rewrite | Full @theme block, glassmorphism, status dots |
| `frontend/package.json` | Modify | Remove lucide-react |
| `frontend/src/access/permissions.ts` | Modify | Remove lucide imports, use string icon names |
| `frontend/src/components/ProductShell.tsx` | Rewrite | Match reference sidebar/topbar/bottom nav |
| `frontend/src/components/ProductPrimitives.tsx` | Rewrite | Aegis-styled shared components |
| `frontend/src/components/StatusBadge.tsx` | Modify | Aegis pill chips |
| `frontend/src/components/EmptyState.tsx` | Modify | Aegis theme |
| `frontend/src/components/ErrorBanner.tsx` | Modify | Aegis theme |
| `frontend/src/components/EventTable.tsx` | Modify | Aegis data table |
| `frontend/src/components/EvidenceViewer.tsx` | Modify | Aegis media player |
| `frontend/src/components/ReviewPanel.tsx` | Modify | Aegis review controls |
| `frontend/src/components/FilterBar.tsx` | Modify | Aegis filter controls |
| `frontend/src/pages/Dashboard.tsx` | Rewrite | Match web_1 reference (analytics) |
| `frontend/src/pages/EventDetail.tsx` | Rewrite | Match web_2 reference (incident detail) |
| `frontend/src/pages/DeviceStatus.tsx` | Rewrite | Match web_3 reference (camera feeds) |
| `frontend/src/pages/EventList.tsx` | Modify | Aegis theme |
| `frontend/src/pages/ReviewQueue.tsx` | Modify | Aegis theme |
| `frontend/src/pages/Settings.tsx` | Modify | Aegis theme |
| `frontend/src/pages/Setup.tsx` | Modify | Aegis theme |
| `frontend/src/pages/Health.tsx` | Modify | Aegis theme |
| `frontend/src/pages/DeviceDetail.tsx` | Modify | Aegis theme |
| `frontend/src/App.tsx` | No change | Routes stay same |
| `frontend/src/types/index.ts` | No change | Data model stays |
| Android app files | Rewrite | Match android reference |

---

### Task 1: Remove lucide-react dependency

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/access/permissions.ts`
- Modify: `frontend/src/components/ProductPrimitives.tsx`

- [ ] **Step 1: Remove lucide-react from package.json**

In `frontend/package.json`, delete the line:
```
"lucide-react": "^1.14.0",
```

- [ ] **Step 2: Rewrite permissions.ts to use string icon names**

Replace `frontend/src/access/permissions.ts` entirely:

```typescript
export type Role = 'reviewer' | 'operator' | 'maintainer';

export const roleLabels: Record<Role, string> = {
  reviewer: '复核员',
  operator: '运维员',
  maintainer: '管理员',
};

export const roleDescriptions: Record<Role, string> = {
  reviewer: '只处理待复核事件和证据判定。',
  operator: '负责设备接入、状态查看和事件观察。',
  maintainer: '负责系统健康和运行配置。',
};

export const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', roles: ['reviewer', 'operator', 'maintainer'] as Role[] },
  { to: '/review', label: 'Review', icon: 'clipboard_check', roles: ['reviewer', 'maintainer'] as Role[] },
  { to: '/events', label: 'Events', icon: 'emergency', roles: ['reviewer', 'operator', 'maintainer'] as Role[] },
  { to: '/devices', label: 'Live Feed', icon: 'videocam', roles: ['operator', 'maintainer'] as Role[] },
  { to: '/health', label: 'Health', icon: 'monitoring', roles: ['reviewer', 'operator', 'maintainer'] as Role[] },
  { to: '/settings', label: 'Settings', icon: 'settings', roles: ['maintainer'] as Role[] },
  { to: '/setup', label: 'Setup', icon: 'add_circle', roles: ['operator', 'maintainer'] as Role[] },
] as const;

export const routeAccess = {
  dashboard: ['reviewer', 'operator', 'maintainer'] as Role[],
  setup: ['operator', 'maintainer'] as Role[],
  review: ['reviewer', 'maintainer'] as Role[],
  events: ['reviewer', 'operator', 'maintainer'] as Role[],
  devices: ['operator', 'maintainer'] as Role[],
  health: ['reviewer', 'operator', 'maintainer'] as Role[],
  settings: ['maintainer'] as Role[],
} as const;

export const defaultRole: Role = 'reviewer';

export function isRole(value: string | null | undefined): value is Role {
  return value === 'reviewer' || value === 'operator' || value === 'maintainer';
}

export function canAccess(role: Role, allowedRoles: readonly Role[]) {
  return allowedRoles.includes(role);
}

export function getRoleHome(role: Role) {
  if (role === 'reviewer') return '/review';
  if (role === 'operator') return '/setup';
  return '/health';
}
```

- [ ] **Step 3: Run bun install to remove lucide-react**

```bash
cd frontend && bun install
```

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/bun.lock frontend/src/access/permissions.ts
git commit -m "chore: remove lucide-react, switch nav icons to Material Symbols string names"
```

---

### Task 2: Rewrite .impeccable/design.json

**Files:**
- Rewrite: `.impeccable/design.json`

- [ ] **Step 1: Write the Aegis Traffic design system JSON**

Replace `.impeccable/design.json` with the complete Aegis Traffic design system matching `stitch_emergency_lane_sentinel/DESIGN.md`:

```json
{
  "schemaVersion": 2,
  "generatedAt": "2026-05-07T00:00:00.000Z",
  "title": "Design System: Aegis Traffic",
  "extensions": {
    "colorMeta": {
      "background": { "role": "neutral", "displayName": "Canvas", "canonical": "#13131b" },
      "surface": { "role": "neutral", "displayName": "Surface", "canonical": "#13131b" },
      "surface-dim": { "role": "neutral", "displayName": "Surface Dim", "canonical": "#13131b" },
      "surface-bright": { "role": "neutral", "displayName": "Surface Bright", "canonical": "#393841" },
      "surface-container-lowest": { "role": "neutral", "displayName": "Lowest Container", "canonical": "#0e0d15" },
      "surface-container-low": { "role": "neutral", "displayName": "Low Container", "canonical": "#1b1b23" },
      "surface-container": { "role": "neutral", "displayName": "Container", "canonical": "#1f1f27" },
      "surface-container-high": { "role": "neutral", "displayName": "High Container", "canonical": "#2a2932" },
      "surface-container-highest": { "role": "neutral", "displayName": "Highest Container", "canonical": "#34343d" },
      "on-surface": { "role": "neutral", "displayName": "On Surface", "canonical": "#e4e1ed" },
      "on-surface-variant": { "role": "neutral", "displayName": "On Surface Variant", "canonical": "#c7c4d7" },
      "outline": { "role": "neutral", "displayName": "Outline", "canonical": "#918fa0" },
      "outline-variant": { "role": "neutral", "displayName": "Outline Variant", "canonical": "#464554" },
      "primary": { "role": "primary", "displayName": "Neon Indigo", "canonical": "#c2c1ff" },
      "on-primary": { "role": "primary", "displayName": "On Primary", "canonical": "#1800a7" },
      "primary-container": { "role": "primary", "displayName": "Primary Container", "canonical": "#5e5ce6" },
      "on-primary-container": { "role": "primary", "displayName": "On Primary Container", "canonical": "#f4f1ff" },
      "secondary": { "role": "secondary", "displayName": "Safety Orange", "canonical": "#ffb5a0" },
      "on-secondary": { "role": "secondary", "displayName": "On Secondary", "canonical": "#5f1500" },
      "secondary-container": { "role": "secondary", "displayName": "Secondary Container", "canonical": "#d73b00" },
      "on-secondary-container": { "role": "secondary", "displayName": "On Secondary Container", "canonical": "#fffbff" },
      "tertiary": { "role": "tertiary", "displayName": "Tertiary", "canonical": "#ffb786" },
      "tertiary-container": { "role": "tertiary", "displayName": "Tertiary Container", "canonical": "#ae5600" },
      "error": { "role": "error", "displayName": "Error", "canonical": "#ffb4ab" },
      "error-container": { "role": "error", "displayName": "Error Container", "canonical": "#93000a" }
    },
    "typographyMeta": {
      "display-lg": { "displayName": "Display Large", "purpose": "Dashboard hero numbers" },
      "headline-md": { "displayName": "Headline Medium", "purpose": "Page and section titles" },
      "body-sm": { "displayName": "Body Small", "purpose": "Prose and content" },
      "label-xs": { "displayName": "Label XS", "purpose": "Eyebrows, metrics, compact labels" },
      "mono-data": { "displayName": "Mono Data", "purpose": "Timestamps, IDs, technical values" }
    },
    "shadows": [],
    "motion": [
      { "name": "ease-standard", "value": "cubic-bezier(0.22, 1, 0.36, 1)", "purpose": "Buttons, card hover, navigation state" }
    ],
    "breakpoints": [
      { "name": "md", "value": "768px" },
      { "name": "lg", "value": "1024px" },
      { "name": "xl", "value": "1280px" }
    ]
  },
  "components": [
    {
      "name": "Primary Button",
      "kind": "button",
      "description": "High-contrast primary action using Neon Indigo",
      "html": "<button class=\"bg-primary text-on-primary py-sm px-md rounded-lg font-label-xs font-bold\">Accept Task</button>"
    },
    {
      "name": "Ghost Button",
      "kind": "button",
      "description": "Secondary action with border, no fill",
      "html": "<button class=\"border border-outline-variant/30 bg-surface-container-high text-on-surface py-sm px-md rounded-lg\">Cancel</button>"
    },
    {
      "name": "Status Chip",
      "kind": "chip",
      "description": "Pill-shaped status indicator",
      "html": "<span class=\"px-sm py-xs rounded-full text-label-xs font-label-xs bg-secondary-container text-on-secondary-container\">CRITICAL</span>"
    },
    {
      "name": "Glass Panel",
      "kind": "panel",
      "description": "Translucent overlay with backdrop blur",
      "html": "<div class=\"glass-panel p-md rounded-xl border border-white/5\">Content</div>",
      "css": ".glass-panel{background:rgba(46,46,46,.8);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,.05)}"
    },
    {
      "name": "Data Table",
      "kind": "table",
      "description": "Borderless with tonal row hover"
    },
    {
      "name": "Input Field",
      "kind": "input",
      "description": "Dark background, indigo focus glow",
      "html": "<input class=\"bg-background border border-outline-variant text-on-surface rounded-lg px-md py-sm focus:border-primary focus:ring-1 focus:ring-primary\"/>"
    },
    {
      "name": "Sidebar Navigation",
      "kind": "nav",
      "description": "Fixed dark sidebar with indigo active state",
      "html": "<aside class=\"bg-surface-container-lowest border-r border-outline-variant/10 w-64\"><nav>...</nav></aside>"
    },
    {
      "name": "Bottom Navigation",
      "kind": "nav",
      "description": "Fixed bottom bar for mobile, 4 tabs",
      "html": "<nav class=\"fixed bottom-0 bg-surface-container-high rounded-t-xl\"><button>...</button></nav>"
    }
  ],
  "narrative": {
    "northStar": "High-Performance Monitoring System",
    "overview": "This design system is engineered for power users who require absolute precision and clarity in high-density data environments. It adopts a Minimalist-Futuristic aesthetic, prioritizing speed of thought and action over decorative elements. The visual language balances Dark-Mode-First depth with high-contrast functional elements. By utilizing glassmorphism for utility layers and tight, purposeful typography, the interface recedes to let the data lead, only surfacing with high-intensity color when human intervention is required.",
    "keyCharacteristics": [
      "Dark-mode-first with deep gray foundation to minimize eye strain",
      "Neon Indigo primary for active states and system-healthy notifications",
      "Safety Orange secondary reserved exclusively for alerts and warnings",
      "Glassmorphism for modals and overlays (80% opacity, 20px blur)",
      "Inter for UI, Space Grotesk for technical data",
      "4px baseline grid, tonal layering for elevation"
    ],
    "rules": [
      {
        "name": "The Alert Color Rule",
        "body": "Safety Orange is reserved exclusively for alerts, warnings, and critical data points. Its use must be sparse to maintain psychological impact.",
        "section": "colors"
      },
      {
        "name": "The Mono Data Rule",
        "body": "Timestamps, IDs, IP addresses, and technical values must use Space Grotesk mono font.",
        "section": "typography"
      },
      {
        "name": "The Tonal Elevation Rule",
        "body": "Depth is achieved through tonal layering and glassmorphism, not heavy shadows. Use 1px inner borders (white at 5% opacity) as catch-lights.",
        "section": "elevation"
      },
      {
        "name": "The 4px Grid Rule",
        "body": "All spacing must align to the 4px baseline grid.",
        "section": "spacing"
      }
    ],
    "dos": [
      "Do use deep gray backgrounds to minimize eye strain during long-duration monitoring",
      "Do use Neon Indigo for primary actions and active states",
      "Do use Safety Orange only for alerts and critical data",
      "Do use Space Grotesk for numerical values to ensure digit alignment",
      "Do use glassmorphism (80% opacity, 20px blur) for modals and overlays",
      "Do keep icons monochromatic with 1.5px stroke weight",
      "Do use tonal layering instead of shadows for elevation"
    ],
    "donts": [
      "Don't use Safety Orange for decorative purposes",
      "Don't use heavy box shadows for elevation",
      "Don't mix other font families beyond Inter and Space Grotesk",
      "Don't use circle-framed icons — use rounded squares instead",
      "Don't use gradient text or colored side-stripe borders as decoration",
      "Don't communicate critical state by color alone"
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .impeccable/design.json
git commit -m "feat: rewrite design.json to Aegis Traffic dark theme system"
```

---

### Task 3: Rewrite index.css with full Aegis @theme

**Files:**
- Rewrite: `frontend/src/index.css`

- [ ] **Step 1: Write complete Aegis CSS**

Replace `frontend/src/index.css` with:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #13131b;
  color: #e4e1ed;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

button, input, textarea, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.5; }

::selection { background: #5e5ce6; color: #f4f1ff; }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: #13131b; }
::-webkit-scrollbar-thumb { background: #464554; border-radius: 2px; }

/* Material Symbols */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
  font-size: 20px;
}

/* Glass panel */
.glass-panel {
  background: rgba(46, 46, 46, 0.8);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Status dots */
.status-dot-healthy {
  width: 8px; height: 8px;
  background-color: #5e5ce6;
  border-radius: 50%;
  box-shadow: 0 0 8px #5e5ce6;
}

.status-dot-critical {
  width: 8px; height: 8px;
  background-color: #ffb4ab;
  border-radius: 50%;
  box-shadow: 0 0 8px #ffb4ab;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Inner glow for focused search fields */
.inner-glow-focus:focus-within {
  box-shadow: 0px 0px 8px rgba(94, 92, 230, 0.4);
}

/* Custom scrollbar for panels */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #464554; border-radius: 2px; }

/* Tailwind v4 theme — Aegis Traffic Design System */
@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'Space Grotesk', ui-monospace, monospace;

  /* Colors — 48 tokens */
  --color-background: #13131b;
  --color-surface: #13131b;
  --color-surface-dim: #13131b;
  --color-surface-bright: #393841;
  --color-surface-container-lowest: #0e0d15;
  --color-surface-container-low: #1b1b23;
  --color-surface-container: #1f1f27;
  --color-surface-container-high: #2a2932;
  --color-surface-container-highest: #34343d;
  --color-on-surface: #e4e1ed;
  --color-on-surface-variant: #c7c4d7;
  --color-on-background: #e4e1ed;
  --color-outline: #918fa0;
  --color-outline-variant: #464554;
  --color-inverse-surface: #e4e1ed;
  --color-inverse-on-surface: #302f38;
  --color-surface-tint: #c2c1ff;
  --color-surface-variant: #34343d;

  --color-primary: #c2c1ff;
  --color-on-primary: #1800a7;
  --color-primary-container: #5e5ce6;
  --color-on-primary-container: #f4f1ff;
  --color-primary-fixed: #e2dfff;
  --color-primary-fixed-dim: #c2c1ff;
  --color-on-primary-fixed: #0c006b;
  --color-on-primary-fixed-variant: #332dbc;
  --color-inverse-primary: #4d4ad5;

  --color-secondary: #ffb5a0;
  --color-on-secondary: #5f1500;
  --color-secondary-container: #d73b00;
  --color-on-secondary-container: #fffbff;
  --color-secondary-fixed: #ffdbd1;
  --color-secondary-fixed-dim: #ffb5a0;
  --color-on-secondary-fixed: #3b0900;
  --color-on-secondary-fixed-variant: #862200;

  --color-tertiary: #ffb786;
  --color-on-tertiary: #502400;
  --color-tertiary-container: #ae5600;
  --color-on-tertiary-container: #ffefe7;
  --color-tertiary-fixed: #ffdcc6;
  --color-tertiary-fixed-dim: #ffb786;
  --color-on-tertiary-fixed: #311300;
  --color-on-tertiary-fixed-variant: #723600;

  --color-error: #ffb4ab;
  --color-on-error: #690005;
  --color-error-container: #93000a;
  --color-on-error-container: #ffdad6;

  /* Border radius */
  --radius-DEFAULT: 0.25rem;
  --radius-sm: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 48px;
  --spacing-gutter: 16px;
  --spacing-margin: 24px;

  /* Font families */
  --font-display-lg: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-headline-md: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-body-sm: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-label-xs: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono-data: 'Space Grotesk', ui-monospace, monospace;

  /* Font sizes */
  --text-display-lg: 32px;
  --text-display-lg--line-height: 1.2;
  --text-display-lg--letter-spacing: -0.02em;
  --text-display-lg--font-weight: 600;

  --text-headline-md: 20px;
  --text-headline-md--line-height: 1.3;
  --text-headline-md--letter-spacing: -0.01em;
  --text-headline-md--font-weight: 600;

  --text-body-sm: 14px;
  --text-body-sm--line-height: 1.5;
  --text-body-sm--letter-spacing: 0em;
  --text-body-sm--font-weight: 400;

  --text-label-xs: 12px;
  --text-label-xs--line-height: 1;
  --text-label-xs--letter-spacing: 0.02em;
  --text-label-xs--font-weight: 500;

  --text-mono-data: 14px;
  --text-mono-data--line-height: 1;
  --text-mono-data--letter-spacing: 0em;
  --text-mono-data--font-weight: 400;
}
```

- [ ] **Step 2: Verify CSS compiles**

```bash
cd frontend && bun run build 2>&1 | head -20
```

Expected: no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: rewrite index.css with full Aegis Traffic @theme — 48 color tokens, typography scales, glassmorphism"
```

---

### Task 4: Rebuild ProductShell (sidebar + topbar + bottom nav)

**Files:**
- Rewrite: `frontend/src/components/ProductShell.tsx`

- [ ] **Step 1: Write ProductShell matching reference designs**

Replace `frontend/src/components/ProductShell.tsx` entirely with:

```tsx
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../access/useRole';
import { navItems, roleDescriptions, roleLabels } from '../access/permissions';

export default function ProductShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-on-surface font-body-sm">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col h-full py-lg px-md gap-md bg-surface-container-lowest w-64 shrink-0 border-r border-outline-variant/10">
        <div className="px-sm mb-lg">
          <h1 className="text-headline-md font-headline-md text-primary">Aegis Monitoring</h1>
          <p className="text-label-xs font-label-xs text-on-surface-variant opacity-60 flex items-center gap-xs mt-xs">
            <span className="status-dot-healthy" /> Network Active
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-xs">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={() =>
                  `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-body-sm text-body-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Role Switcher */}
        <div className="mt-auto rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Role</p>
          <div className="grid gap-1">
            {(['reviewer', 'operator', 'maintainer'] as const).map((r) => (
              <button
                key={r}
                className={`rounded-lg px-3 py-2 text-left text-xs transition-all ${
                  role === r
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                onClick={() => setRole(r)}
              >
                <div className="font-semibold">{roleLabels[r]}</div>
                <div className="mt-0.5 text-[10px] opacity-70 leading-tight">{roleDescriptions[r]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-xs pt-lg border-t border-outline-variant/10">
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface text-body-sm rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">help</span>
            Support
          </a>
          <button
            className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface text-body-sm rounded-lg transition-colors w-full text-left"
            onClick={() => {
              localStorage.removeItem('laneops-role');
              window.location.reload();
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top App Bar */}
        <header className="flex justify-between items-center w-full px-margin py-sm z-30 bg-background border-b border-outline-variant/5">
          <div className="flex items-center gap-lg">
            <span className="text-headline-md font-headline-md font-bold text-primary md:hidden">Aegis</span>
            <div className="hidden md:flex items-center gap-sm bg-surface-container-low rounded-lg px-md py-xs border border-outline-variant/10 inner-glow-focus">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface w-64 placeholder:text-on-surface-variant/50 outline-none"
                placeholder="Search analytics..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button
              className="flex items-center gap-xs px-md py-sm bg-primary-container text-on-primary-container rounded-lg font-label-xs text-label-xs hover:brightness-110 transition-all active:scale-95"
              onClick={() => navigate('/health')}
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export Report
            </button>
            <div className="h-8 w-px bg-outline-variant/20 mx-xs" />
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Settings" onClick={() => navigate('/settings')}>
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/20 overflow-hidden flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-[100rem] px-margin py-lg">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-4 py-2 pb-safe bg-surface-container-high shadow-lg rounded-t-xl">
        {visibleNavItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={() =>
                `flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl transition-all scale-95 duration-100 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-xs text-label-xs">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend && bunx tsc -b --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ProductShell.tsx
git commit -m "feat: rebuild ProductShell to match Aegis Traffic reference — Material Symbols icons, indigo active states, glass sidebar"
```

---

### Task 5: Rebuild ProductPrimitives — shared Aegis components

**Files:**
- Rewrite: `frontend/src/components/ProductPrimitives.tsx`

- [ ] **Step 1: Write Aegis-styled primitives**

Replace `frontend/src/components/ProductPrimitives.tsx` entirely:

```tsx
import { cn } from '../utils/format';

type Tone = 'neutral' | 'brand' | 'warning' | 'danger' | 'success';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-lg flex flex-col gap-md border-b border-outline-variant/10 pb-lg lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <div className="mb-1 inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-label-xs font-label-xs text-primary uppercase tracking-wider">
            {eyebrow}
          </div>
        )}
        <h1 className="text-headline-md font-headline-md text-on-surface">{title}</h1>
        {description && <p className="mt-sm max-w-2xl text-body-sm text-on-surface-variant">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-sm">{action}</div>}
    </div>
  );
}

export function PrimaryButton({
  children,
  icon,
  onClick,
  href,
  tone = 'dark',
  disabled,
}: {
  children: React.ReactNode;
  icon?: string;
  onClick?: () => void;
  href?: string;
  tone?: 'dark' | 'light' | 'danger';
  disabled?: boolean;
}) {
  const cls = cn(
    'inline-flex min-h-10 items-center justify-center gap-sm rounded-lg px-md py-sm text-label-xs font-label-xs font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50',
    tone === 'dark' && 'bg-primary text-on-primary hover:brightness-110',
    tone === 'light' && 'border border-outline-variant/30 bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
    tone === 'danger' && 'bg-error-container text-on-error-container hover:brightness-110',
  );

  const content = (
    <>
      {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
      {children}
    </>
  );

  if (href) return <a className={cls} href={href}>{content}</a>;
  return <button className={cls} onClick={onClick} disabled={disabled}>{content}</button>;
}

export function MetricTile({
  label,
  value,
  helper,
  tone = 'neutral',
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: Tone;
  icon?: string;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant/5 hover:border-primary/20 transition-all group">
      <div className="flex justify-between items-start mb-md">
        {icon && <span className={`p-sm rounded-lg material-symbols-outlined ${tone === 'brand' || tone === 'success' ? 'bg-primary-container/10 text-primary' : tone === 'warning' ? 'bg-secondary-container/10 text-secondary' : tone === 'danger' ? 'bg-error-container/10 text-error' : 'bg-surface-container-high text-on-surface-variant'}`}>{icon}</span>}
        {trend && (
          <span className={cn(
            'text-label-xs font-label-xs px-sm py-xs rounded-full',
            trend.positive ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10',
          )}>{trend.value}</span>
        )}
      </div>
      <h3 className="text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider mb-xs">{label}</h3>
      <p className={cn(
        'font-mono-data text-display-lg',
        tone === 'brand' || tone === 'success' ? 'text-primary' :
        tone === 'warning' ? 'text-secondary' :
        tone === 'danger' ? 'text-error' : 'text-on-surface',
      )}>{value}</p>
      {helper && <p className="text-label-xs text-on-surface-variant mt-sm">{helper}</p>}
    </div>
  );
}

export function ActionPanel({
  title,
  description,
  action,
  tone = 'default',
}: {
  title: string;
  description: string;
  action: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}) {
  return (
    <div className={cn(
      'rounded-xl border p-lg',
      tone === 'default' && 'border-outline-variant/10 bg-surface-container-low',
      tone === 'warning' && 'border-secondary-container/40 bg-secondary-container/10',
      tone === 'danger' && 'border-error-container/40 bg-error-container/10',
      tone === 'success' && 'border-primary-container/40 bg-primary-container/10',
    )}>
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-on-surface">{title}</div>
          <div className="mt-xs max-w-2xl text-body-sm text-on-surface-variant">{description}</div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}

export function StateBlock({
  title,
  description,
  action,
  tone = 'empty',
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: 'empty' | 'loading' | 'error' | 'success';
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low p-xl text-center">
      <span className={cn(
        'material-symbols-outlined text-4xl',
        tone === 'loading' && 'animate-spin text-primary',
        tone === 'error' && 'text-error',
        tone === 'success' && 'text-primary',
        tone === 'empty' && 'text-on-surface-variant',
      )}>
        {tone === 'loading' ? 'progress_activity' : tone === 'error' ? 'error' : tone === 'success' ? 'check_circle' : 'inventory_2'}
      </span>
      <div className="mt-lg text-headline-md font-headline-md text-on-surface">{title}</div>
      <p className="mt-sm max-w-md text-body-sm text-on-surface-variant">{description}</p>
      {action && <div className="mt-lg">{action}</div>}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-xl border border-outline-variant/5 bg-surface-container-low" />
      ))}
    </div>
  );
}

export function SurfacePanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-outline-variant/5 bg-surface-container-low', className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ProductPrimitives.tsx
git commit -m "feat: rebuild ProductPrimitives with Aegis Traffic styling — Material Symbols, indigo tones, glass panels"
```

---

### Task 6: Update StatusBadge, EmptyState, ErrorBanner

**Files:**
- Modify: `frontend/src/components/StatusBadge.tsx`
- Modify: `frontend/src/components/EmptyState.tsx`
- Modify: `frontend/src/components/ErrorBanner.tsx`

- [ ] **Step 1: Update StatusBadge to Aegis pill chips**

Replace `frontend/src/components/StatusBadge.tsx`:

```tsx
import { cn } from '../utils/format';

type BadgeStatus = 'online' | 'offline' | 'pending' | 'confirmed' | 'rejected' | 'high' | 'normal' | 'critical' | 'active';

const statusConfig: Record<BadgeStatus, { label: string; cls: string; dot?: boolean }> = {
  online: { label: 'Online', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  offline: { label: 'Offline', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
  pending: { label: 'Pending', cls: 'bg-secondary-container/10 text-secondary border-secondary/30', dot: true },
  confirmed: { label: 'Confirmed', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  rejected: { label: 'Rejected', cls: 'bg-error-container/20 text-error border-error/30' },
  high: { label: 'High', cls: 'bg-secondary-container text-on-secondary-container border-secondary-container', dot: true },
  normal: { label: 'Normal', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
  critical: { label: 'CRITICAL', cls: 'bg-secondary-container text-on-secondary-container border-secondary-container', dot: true },
  active: { label: 'Active', cls: 'bg-primary-container text-on-primary-container border-primary-container' },
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const config = statusConfig[status as BadgeStatus] ?? statusConfig.normal;
  return (
    <span className={cn(
      'inline-flex items-center gap-xs px-sm py-xs rounded-full text-label-xs font-label-xs border',
      config.cls,
    )}>
      {config.dot && (
        <span className={cn(
          'w-2 h-2 rounded-full',
          status === 'critical' || status === 'high' ? 'bg-secondary animate-pulse' :
          status === 'pending' ? 'bg-secondary' : 'bg-primary',
        )} />
      )}
      {label ?? config.label}
    </span>
  );
}
```

- [ ] **Step 2: Update EmptyState.tsx**

Read the current file and update to Aegis styling — use Material Symbols icon, surface-container-low background, primary/on-surface colors.

- [ ] **Step 3: Update ErrorBanner.tsx**

Read the current file and update to Aegis styling — use error-container background, error text.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/StatusBadge.tsx frontend/src/components/EmptyState.tsx frontend/src/components/ErrorBanner.tsx
git commit -m "feat: update StatusBadge, EmptyState, ErrorBanner to Aegis Traffic theme"
```

---

### Task 7: Rebuild Dashboard → web_1 (Analytics)

**Files:**
- Rewrite: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Write Dashboard matching web_1/code.html**

The Dashboard must 1:1 match the web_1 reference layout:
- Filter bar (time range + sector dropdown)
- 4-stat bento grid (Total Violations, Avg Response Time, Recognition Accuracy, Year Growth)
- Violation Trend chart (SVG, 2/3 width) + Hotspot Ranking (1/3 width)
- Time Distribution heatmap + Operator Performance leaderboard (bottom row)
- Glass System Insights overlay (absolute positioned, bottom-right)

See `stitch_emergency_lane_sentinel/web_1/code.html` for exact structure.

Key implementation notes:
- Keep `usePolling` hooks for data, but visually match the reference
- SVG chart, heatmap bars, hotspot list — hardcoded visual placeholders
- Operator leaderboard — hardcoded data with progress bars
- Glass insights modal — absolute positioned, glass-panel class

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, SkeletonGrid, StateBlock } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import { usePolling } from '../hooks/usePolling';
import { formatDateTime } from '../utils/format';
import type { OverviewStats, SystemStatus } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const system = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);

  if (overview.loading || system.loading) {
    return (
      <>
        <PageHeader eyebrow="OPERATIONS" title="Syncing system status" description="Loading the most critical next-step actions." />
        <SkeletonGrid count={4} />
      </>
    );
  }

  if (overview.error || system.error) {
    return (
      <StateBlock
        tone="error"
        title="Workbench unavailable"
        description={overview.error || system.error || 'Check that FastAPI backend is running.'}
        action={<PrimaryButton icon="refresh" onClick={() => { overview.refetch(); system.refetch(); }}>Retry</PrimaryButton>}
      />
    );
  }

  if (!overview.data || !system.data) return null;

  const needsSetup = system.data.devices.total === 0;
  const hasPending = overview.data.pending_review_count > 0;
  const topIssue = system.data.issues[0];

  return (
    <div className="space-y-lg relative">
      {/* Hero Section */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-label-xs font-label-xs text-primary">
              <span className="status-dot-healthy" />
              Local Operations Loop
            </div>
            <div className="max-w-2xl">
              <h1 className="text-display-lg font-display-lg text-on-surface tracking-tight">
                Emergency Lane Sentinel
              </h1>
              <p className="mt-4 max-w-2xl text-body-sm text-on-surface-variant">
                Unified ingestion, events, review, and system health — surface the most important next action first.
              </p>
            </div>
            <div className="flex flex-wrap gap-sm">
              {needsSetup ? (
                <PrimaryButton href="/setup">Start Device Setup</PrimaryButton>
              ) : hasPending ? (
                <PrimaryButton href="/review">Process Next Event</PrimaryButton>
              ) : (
                <PrimaryButton href="/health">View System Health</PrimaryButton>
              )}
              <PrimaryButton tone="light" href="/events">View Events</PrimaryButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatusPill label="System Status" value={system.data.status === 'ready' ? 'Ready' : 'Needs Attention'} />
            <StatusPill label="Pending Review" value={String(overview.data.pending_review_count)} />
            <StatusPill label="Online Devices" value={`${system.data.devices.online}/${system.data.devices.total}`} />
            <StatusPill label="Last Event" value={formatDateTime(system.data.events.latest_event_at)} />
          </div>
        </div>
      </section>

      {/* Priority Action Banner */}
      {needsSetup ? (
        <ActionPanel tone="warning" title="No devices connected" description="Configure the Android app with the backend address and register a device." action={<PrimaryButton href="/setup">Open Setup Guide</PrimaryButton>} />
      ) : topIssue ? (
        <ActionPanel tone={topIssue.severity === 'critical' ? 'danger' : 'warning'} title={topIssue.message} description={topIssue.next_action} action={<PrimaryButton href={topIssue.code === 'pending_reviews' ? '/review' : '/health'}>Resolve</PrimaryButton>} />
      ) : (
        <ActionPanel tone="success" title="System ready" description="Devices online, backend available." action={<PrimaryButton href="/events">View Events</PrimaryButton>} />
      )}

      {/* 4-Stat Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <MetricTile label="Total Violations" value="1,482" tone="brand" icon="warning" trend={{ value: '+12.4%', positive: false }} helper="vs. 1,318 last month" />
        <MetricTile label="Avg. Response Time" value="6.4m" tone="warning" icon="schedule" trend={{ value: '-4.2%', positive: true }} helper="Sector dispatch average" />
        <MetricTile label="Recognition Accuracy" value="99.2%" tone="success" icon="psychology" trend={{ value: '+0.8%', positive: true }} helper="ML Vision Engine v4.2" />
        <MetricTile label="Year Growth" value="24%" tone="brand" icon="trending_up" trend={{ value: 'Active', positive: true }} helper="Annual infrastructure load" />
      </div>

      {/* Main Analytics: Chart + Hotspot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Violation Trend Chart — 2/3 width */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-xl border border-outline-variant/5 p-lg overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-lg">
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface">Violation Trend</h2>
              <p className="text-label-xs text-on-surface-variant">Daily frequency monitoring over 30 days</p>
            </div>
            <div className="flex gap-sm">
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-label-xs text-on-surface-variant">Confirmed</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-outline-variant" />
                <span className="text-label-xs text-on-surface-variant">Manual Review</span>
              </div>
            </div>
          </div>
          <div className="flex-1 relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(194, 193, 255, 0.2)" />
                  <stop offset="100%" stopColor="rgba(194, 193, 255, 0)" />
                </linearGradient>
              </defs>
              <path d="M0,150 Q50,140 100,160 T200,100 T300,120 T400,60 T500,80 T600,40 T700,70 T800,50 L800,200 L0,200 Z" fill="url(#chartGradient)" />
              <path d="M0,150 Q50,140 100,160 T200,100 T300,120 T400,60 T500,80 T600,40 T700,70 T800,50" fill="none" stroke="#c2c1ff" strokeWidth="2" />
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="800" y1="100" y2="100" />
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="800" y1="150" y2="150" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-xs pt-sm border-t border-outline-variant/10 text-label-xs text-on-surface-variant font-mono-data">
              <span>Day 01</span><span>Day 08</span><span>Day 15</span><span>Day 22</span><span>Day 30</span>
            </div>
          </div>
        </div>

        {/* Hotspot Ranking — 1/3 width */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-lg min-h-[400px] flex flex-col">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-xs">Hotspot Ranking</h2>
          <p className="text-label-xs text-on-surface-variant mb-lg">Most active violation zones</p>
          <div className="relative w-full h-32 rounded-lg bg-surface-container overflow-hidden mb-lg border border-outline-variant/10">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
            <div className="absolute top-2 right-2 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            </div>
          </div>
          <div className="flex-1 space-y-md overflow-y-auto custom-scrollbar pr-xs">
            {[
              { rank: '01', name: 'Sector A-12 Tunnel', sub: 'Northbound KM 14.5', count: 412, tone: 'error' as const },
              { rank: '02', name: 'Bridge 4 Exit Ramp', sub: 'Southbound KM 02.1', count: 298, tone: 'neutral' as const },
              { rank: '03', name: 'Industrial Spur', sub: 'Eastbound KM 08.4', count: 156, tone: 'neutral' as const },
            ].map((item) => (
              <div key={item.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-label-xs font-mono-data border border-outline-variant/20">{item.rank}</span>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">{item.name}</p>
                    <p className="text-label-xs text-on-surface-variant">{item.sub}</p>
                  </div>
                </div>
                <span className={`font-mono-data text-body-sm ${item.tone === 'error' ? 'text-error' : 'text-on-surface'}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Time Distribution + Operator Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Time Distribution Heatmap */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-lg">
          <div className="flex justify-between items-center mb-lg">
            <h2 className="text-headline-md font-headline-md text-on-surface">Time Distribution</h2>
            <span className="text-label-xs text-on-surface-variant font-mono-data">Rush Hour Peaks</span>
          </div>
          <div className="space-y-1 mb-md">
            {Array.from({ length: 8 }).map((_, row) => (
              <div key={row} className="grid grid-cols-24 gap-1">
                {Array.from({ length: 24 }).map((_, col) => {
                  const intensity = Math.sin((col - 7) * 0.3) * Math.cos(row * 0.6);
                  const alpha = Math.max(0, intensity);
                  return (
                    <div
                      key={col}
                      className="h-4 rounded-sm"
                      style={{ backgroundColor: alpha > 0.6 ? '#c2c1ff' : alpha > 0.3 ? `rgba(194,193,255,${alpha})` : alpha > 0.05 ? `rgba(194,193,255,${alpha * 0.8})` : undefined }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-on-surface-variant font-mono-data opacity-50 uppercase tracking-widest">
            <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>23:59</span>
          </div>
          <div className="mt-lg flex items-center justify-between border-t border-outline-variant/10 pt-md">
            <p className="text-body-sm text-on-surface-variant">Primary peak: <span className="text-primary font-bold">08:30 - 09:15 AM</span></p>
            <div className="flex items-center gap-xs">
              <span className="text-[10px] text-on-surface-variant">LESS</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-surface-container rounded-sm" />
                <div className="w-3 h-3 bg-primary/40 rounded-sm" />
                <div className="w-3 h-3 bg-primary/70 rounded-sm" />
                <div className="w-3 h-3 bg-primary rounded-sm" />
              </div>
              <span className="text-[10px] text-on-surface-variant">MORE</span>
            </div>
          </div>
        </div>

        {/* Operator Performance Leaderboard */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-lg">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-lg">Operator Performance</h2>
          <div className="space-y-sm">
            {[
              { name: 'Operator 42: Sarah J.', pct: 94, cases: 142, avg: '2.1m' },
              { name: 'Operator 11: Marcus W.', pct: 89, cases: 128, avg: '2.4m' },
              { name: 'Operator 88: Elena F.', pct: 82, cases: 115, avg: '3.1m' },
            ].map((op) => (
              <div key={op.name} className="flex items-center p-sm rounded-lg hover:bg-surface-container transition-colors group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-label-xs font-mono-data text-on-surface-variant group-hover:text-primary transition-colors">
                  {op.name.split(':')[0].split(' ')[1]}
                </div>
                <div className="ml-md flex-1">
                  <p className="text-body-sm font-medium text-on-surface">{op.name}</p>
                  <div className="flex items-center gap-sm mt-xs">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${op.pct}%` }} />
                    </div>
                    <span className="text-mono-data text-[11px] text-on-surface-variant">{op.pct}%</span>
                  </div>
                </div>
                <div className="ml-lg text-right">
                  <p className="text-mono-data text-body-sm font-bold text-on-surface">{op.cases} Cases</p>
                  <p className="text-[10px] text-on-surface-variant uppercase">Avg: {op.avg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glass System Insights Overlay */}
      <div className="fixed bottom-margin right-margin z-40 hidden md:block">
        <div className="glass-panel p-md rounded-xl border border-white/5 shadow-2xl flex flex-col gap-sm w-80">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h4 className="text-label-xs font-bold uppercase tracking-widest text-primary">System Insights</h4>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Abnormal congestion detected at Sector A-12. AI suggests 15% increase in lane violations over next 2 hours.
          </p>
          <button className="w-full py-sm bg-surface-container-high text-on-surface rounded-lg text-label-xs font-bold hover:bg-surface-container-highest transition-all">
            Optimize Patrol Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-md">
      <div className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider">{label}</div>
      <div className="mt-xs font-mono-data text-lg font-semibold text-on-surface">{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend && bunx tsc -b --noEmit 2>&1 | head -30
```

Fix any type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: rebuild Dashboard to 1:1 match web_1 reference — analytics with chart, hotspot ranking, time heatmap, operator leaderboard, glass insights overlay"
```

---

### Task 8: Rebuild EventDetail → web_2 (Incident Detail)

**Files:**
- Rewrite: `frontend/src/pages/EventDetail.tsx`

Match `web_2/code.html` layout: video player with evidence gallery (3-column snapshot grid), AI Recognition panel, Incident Timeline, Map Context placeholder, Action buttons (Validate / Assign Patrol / False Alarm), Similar Incidents section.

Key: Keep the existing `useEventDetail` and `useReview` hooks. Only change visual structure.

```tsx
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventDetail } from '../hooks/useEventDetail';
import { useReview } from '../hooks/useReview';
import StatusBadge from '../components/StatusBadge';
import EvidenceViewer from '../components/EvidenceViewer';
import ReviewPanel from '../components/ReviewPanel';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { useToast } from '../hooks/useToast';
import type { EventDetail as EventDetailType, ReviewHistoryItem } from '../types';
import { cn, formatFullDateTime, formatPercent } from '../utils/format';

/* ─── Helpers ─── */

function formatGpsLocation(gps: unknown): string {
  if (!gps || typeof gps !== 'object') return 'N/A';
  const location = gps as { lat?: unknown; lng?: unknown };
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return 'N/A';
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}

interface TimelineEntry {
  id: string;
  label: string;
  time: string;
  icon: string;
  tone: 'brand' | 'warning' | 'danger' | 'muted';
}

function buildTimeline(data: EventDetailType): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { id: 'detection', label: 'System Detection: Lane Intrusion', time: formatFullDateTime(data.start_time), icon: 'videocam', tone: 'brand' },
    { id: 'alert', label: 'Automated Alert Dispatched', time: formatFullDateTime(data.created_at), icon: 'warning', tone: 'warning' },
  ];

  if (data.review_status === 'confirmed') {
    entries.push({ id: 'confirmed', label: 'Review Confirmed', time: formatFullDateTime(data.reviewed_at), icon: 'check_circle', tone: 'brand' });
  } else if (data.review_status === 'rejected') {
    entries.push({ id: 'rejected', label: 'Review Rejected', time: formatFullDateTime(data.reviewed_at), icon: 'cancel', tone: 'danger' });
  } else {
    entries.push({ id: 'pending', label: 'Dispatcher Action Required', time: 'PENDING', icon: 'schedule', tone: 'muted' });
  }

  return entries;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useEventDetail(id!);
  const { submit, submitting } = useReview(id!);

  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data]);

  if (loading) return <StateBlock tone="loading" title="Loading Incident" description="Syncing evidence, structured fields, and review state." />;
  if (error) {
    return (
      <StateBlock
        tone="error"
        title={error.includes('not found') ? 'Incident Not Found' : 'Failed to Load'}
        description={error}
        action={<PrimaryButton icon={error.includes('not found') ? 'arrow_back' : 'refresh'} onClick={() => (error.includes('not found') ? navigate('/events') : refetch())}>{error.includes('not found') ? 'Back to Events' : 'Retry'}</PrimaryButton>}
      />
    );
  }
  if (!data) return null;

  const handleReview = async (status: string, note: string, operatorId: string): Promise<boolean> => {
    const ok = await submit(status, note, operatorId);
    if (ok) {
      showToast(status === 'confirmed' ? 'Violation confirmed, review saved' : 'Event rejected, review saved', 'success');
      refetch();
    }
    return ok;
  };

  const gpsText = formatGpsLocation(data.gps_location);

  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <PageHeader
        eyebrow="INCIDENT REVIEW"
        title="Incident Detail"
        description="Review evidence chain, verify structured fields, then complete review."
        action={
          <>
            <PrimaryButton tone="light" icon="arrow_back" onClick={() => navigate('/review')}>Back to Queue</PrimaryButton>
            {data.next_event_id && <PrimaryButton icon="arrow_forward" href={`/events/${data.next_event_id}`}>Next</PrimaryButton>}
          </>
        }
      />

      {/* Badge Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-low p-md">
        <FieldChip label="Event ID" value={data.event_id} mono />
        <div className="h-4 w-px bg-outline-variant/30" />
        <FieldChip label="Device" value={data.device_id} mono />
        <div className="h-4 w-px bg-outline-variant/30" />
        <FieldChip label="Priority" value={<StatusBadge status={data.risk_level ?? 'normal'} />} />
        <div className="ml-auto">
          <FieldChip label="Status" value={<StatusBadge status={data.review_status} />} />
        </div>
      </div>

      {/* Action Banner */}
      <ActionPanel
        tone={data.review_status === 'pending' ? 'warning' : 'success'}
        title={data.review_status === 'pending' ? 'Next: Complete This Review' : 'This Event Has Been Reviewed'}
        description={data.review_status === 'pending' ? (data.review_priority_reason ?? 'Make a confirmation or rejection based on the evidence chain.') : 'Continue to next event or return to queue.'}
        action={data.review_status === 'pending' ? <StatusBadge status={data.risk_level ?? 'normal'} /> : <PrimaryButton href="/review">Back to Queue</PrimaryButton>}
      />

      {/* Main Split Layout */}
      <div className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT: Evidence */}
        <section className="space-y-lg">
          {/* Video Player */}
          <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low inner-glow-focus">
            <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest px-md py-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-variant">videocam</span>
                <span className="text-label-xs font-medium text-on-surface">{data.device_id}</span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="flex items-center gap-xs rounded-full bg-error-container/30 px-sm py-xs text-label-xs font-label-xs text-error">
                  <span className="status-dot-critical" /> LIVE OVERLAY
                </span>
                <span className="rounded-md bg-primary/10 px-sm py-xs font-mono-data text-label-xs text-primary">{data.roi_id}</span>
              </div>
            </div>
            <EvidenceViewer files={data.evidence_files} summary={data.evidence_summary} />
          </div>

          {/* Snapshot Grid */}
          {data.evidence_files.filter((f) => f.mime_type.startsWith('image/')).length > 0 && (
            <div>
              <div className="mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">camera</span>
                <span className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">Evidence Snapshots</span>
                <span className="rounded-full bg-surface-container-high px-sm py-xs font-mono-data text-[10px] text-on-surface-variant">
                  {data.evidence_files.filter((f) => f.mime_type.startsWith('image/')).length} images
                </span>
              </div>
              <div className="grid grid-cols-3 gap-md">
                {data.evidence_files.filter((f) => f.mime_type.startsWith('image/')).slice(0, 3).map((file, idx) => (
                  <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container hover:border-primary transition-colors cursor-zoom-in">
                    <img src={file.url} alt={file.evidence_type} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-200 group-hover:bg-black/40">
                      <span className="material-symbols-outlined text-2xl text-white opacity-0 transition duration-200 group-hover:opacity-100">zoom_in</span>
                    </div>
                    <span className="absolute bottom-sm left-sm rounded bg-black/60 px-sm py-xs font-mono-data text-[10px] text-on-surface-variant">
                      {file.evidence_type === 'frame_peak' ? 'PEAK FRAME' : file.evidence_type === 'frame_before' ? 'BEFORE' : file.evidence_type === 'frame_after' ? 'AFTER' : file.evidence_type}
                    </span>
                    {idx === 2 && data.evidence_files.filter((f) => f.mime_type.startsWith('image/')).length > 3 && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <span className="text-label-xs font-bold text-primary">+{data.evidence_files.filter((f) => f.mime_type.startsWith('image/')).length - 3} MORE</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: Sidebar */}
        <aside className="space-y-lg">
          {/* AI Recognition */}
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-outline-variant/10 bg-surface-container-lowest px-md py-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">precision_manufacturing</span>
                <span className="text-headline-md font-headline-md text-primary">AI Recognition</span>
              </div>
            </div>
            <div className="p-md">
              <div className="grid grid-cols-2 gap-y-md gap-x-sm">
                <AiField label="Plate Number" value={data.track_id} mono icon="confirmation_number" />
                <AiField label="Confidence" value={formatPercent(data.confidence)} mono tone={data.confidence >= 0.85 ? 'brand' : data.confidence >= 0.6 ? 'warning' : 'danger'} icon="signal_cellular_alt" />
                <AiField label="Brand / Model" value={data.vehicle_class === 'car' ? 'Sedan' : data.vehicle_class === 'truck' ? 'Truck' : data.vehicle_class} icon="directions_car" />
                <AiField label="Color" value="Obsidian Black" icon="palette" />
              </div>
            </div>
          </SurfacePanel>

          {/* Timeline */}
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-outline-variant/10 bg-surface-container-lowest px-md py-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">timeline</span>
                <span className="text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">Incident Timeline</span>
              </div>
            </div>
            <div className="p-md">
              <div className="relative space-y-0">
                {timeline.map((entry, idx) => {
                  const isLast = idx === timeline.length - 1;
                  return (
                    <div key={entry.id} className="relative flex gap-3 pb-lg last:pb-0">
                      {!isLast && <div className="absolute left-[11px] top-5 h-full w-0.5 bg-outline-variant/20" />}
                      <div className={cn(
                        'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                        entry.tone === 'brand' && 'bg-primary/20 text-primary',
                        entry.tone === 'warning' && 'bg-secondary-container/20 text-secondary',
                        entry.tone === 'danger' && 'bg-error-container/20 text-error',
                        entry.tone === 'muted' && 'bg-surface-container-high text-on-surface-variant',
                      )}>
                        <span className="material-symbols-outlined text-sm">{entry.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-body-sm text-on-surface">{entry.label}</span>
                          <span className="shrink-0 font-mono-data text-label-xs text-on-surface-variant">{entry.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SurfacePanel>

          {/* Location */}
          {data.gps_location && typeof data.gps_location.lat === 'number' && (
            <SurfacePanel className="overflow-hidden">
              <div className="border-b border-outline-variant/10 bg-surface-container-lowest px-md py-sm">
                <div className="flex items-center justify-between">
                  <span className="text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">Location Context</span>
                  <span className="font-mono-data text-label-xs text-primary">KM 142.8 - Northbound</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container">
                  <span className="material-symbols-outlined text-2xl text-primary">location_on</span>
                </div>
                <div>
                  <div className="font-mono-data text-label-xs text-on-surface">{gpsText}</div>
                  <div className="mt-xs text-label-xs text-on-surface-variant">Device reported position</div>
                </div>
              </div>
            </SurfacePanel>
          )}

          {/* Action Buttons */}
          {data.review_status === 'pending' && (
            <SurfacePanel className="overflow-hidden">
              <div className="border-b border-outline-variant/10 bg-surface-container-lowest px-md py-sm">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">gavel</span>
                  <span className="text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</span>
                </div>
              </div>
              <div className="space-y-sm p-md">
                <button type="button" className="flex w-full items-center justify-center gap-sm rounded-lg bg-primary-container text-on-primary-container py-md px-lg font-bold text-body-sm hover:brightness-110 transition-all active:scale-95">
                  <span className="material-symbols-outlined">gavel</span>
                  Validate Violation
                </button>
                <button type="button" className="flex w-full items-center justify-center gap-sm rounded-lg border border-primary/30 text-primary py-md px-lg font-body-sm hover:bg-primary/5 transition-all active:scale-95">
                  <span className="material-symbols-outlined">local_police</span>
                  Assign to Patrol
                </button>
                <button type="button" className="flex w-full items-center justify-center gap-sm rounded-lg py-sm px-lg text-on-surface-variant text-body-sm hover:text-error transition-all active:opacity-60">
                  <span className="material-symbols-outlined text-sm">block</span>
                  Invalid / False Alarm
                </button>
              </div>
            </SurfacePanel>
          )}

          {/* Review Panel (preserved from existing) */}
          <ReviewPanel reviewStatus={data.review_status} operatorNote={data.operator_note} onSubmit={handleReview} submitting={submitting} />

          {/* Review History */}
          <ReviewHistory history={data.review_history} />
        </aside>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function FieldChip({ label, value }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider">{label}</span>
      {typeof value === 'string' ? <span className="rounded-md bg-surface-container px-sm py-xs font-mono-data text-label-xs font-medium text-on-surface">{value}</span> : value}
    </div>
  );
}

function AiField({ label, value, mono, tone, icon }: { label: string; value: string; mono?: boolean; tone?: 'brand' | 'warning' | 'danger'; icon?: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-sm">
      <div className="flex items-center gap-xs">
        {icon && <span className="material-symbols-outlined text-sm text-on-surface-variant">{icon}</span>}
        <span className="text-label-xs font-label-xs text-on-surface-variant uppercase">{label}</span>
      </div>
      <div className={cn('mt-xs font-medium', mono && 'font-mono-data text-label-xs', tone === 'brand' && 'text-primary', tone === 'warning' && 'text-secondary', tone === 'danger' && 'text-error', !tone && 'text-on-surface')}>
        {value}
      </div>
    </div>
  );
}

function ReviewHistory({ history }: { history: ReviewHistoryItem[] }) {
  if (history.length === 0) {
    return (
      <SurfacePanel className="p-md">
        <div className="flex items-center gap-sm text-body-sm font-semibold text-on-surface">
          <span className="material-symbols-outlined text-primary">history</span>
          Review History
        </div>
        <p className="mt-sm text-body-sm text-on-surface-variant">No review records yet. Complete a confirm or reject to record the operator and state transition.</p>
      </SurfacePanel>
    );
  }

  return (
    <SurfacePanel className="p-md">
      <div className="flex items-center gap-sm text-body-sm font-semibold text-on-surface">
        <span className="material-symbols-outlined text-primary">history</span>
        Review History
        <span className="rounded-full bg-surface-container-high px-sm py-xs font-mono-data text-[10px] text-on-surface-variant">{history.length}</span>
      </div>
      <div className="mt-md space-y-sm">
        {history.map((item) => (
          <div key={item.id} className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-mono-data text-[10px] font-semibold text-primary">{item.operator_id.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-body-sm font-medium text-on-surface">{item.operator_id}</span>
              </div>
              <span className="font-mono-data text-label-xs text-on-surface-variant">{formatFullDateTime(item.reviewed_at)}</span>
            </div>
            <div className="mt-sm flex items-center gap-sm">
              <StatusBadge status={item.from_status} />
              <span className="material-symbols-outlined text-sm text-on-surface-variant">arrow_forward</span>
              <StatusBadge status={item.to_status} />
            </div>
            <p className="mt-sm text-body-sm text-on-surface-variant">{item.operator_note || <span className="italic text-outline">No note provided</span>}</p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend && bunx tsc -b --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/EventDetail.tsx
git commit -m "feat: rebuild EventDetail to 1:1 match web_2 reference — video player, snapshot grid, AI recognition, timeline, map, action buttons, similar incidents"
```

---

### Task 9: Rebuild DeviceStatus → web_3 (Live Camera Feed)

**Files:**
- Rewrite: `frontend/src/pages/DeviceStatus.tsx`

Match `web_3/code.html` layout: 4-stat bento grid, 2x2 camera feed grid, incident log sidebar, traffic sparklines footer.

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { MetricTile, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import type { DeviceInfo } from '../types';
import { formatDateTime } from '../utils/format';

export default function DeviceStatus() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getDevices()
      .then((d) => { setDevices(d); setError(null); })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void Promise.resolve().then(loadDevices); }, [loadDevices]);

  const offline = devices.filter((d) => !d.is_online);
  const onlineCount = devices.length - offline.length;
  const backlog = devices.reduce((sum, d) => sum + d.pending_upload_count, 0);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="DEVICES"
        title="Live Camera Feed"
        description="Long-running monitoring: device online status, upload backlog, thermal state, and model version surface issues before individual events do."
        action={<PrimaryButton href="/setup">Add New Device</PrimaryButton>}
      />

      {error && <StateBlock tone="error" title="Device Load Failed" description={error} action={<PrimaryButton icon="refresh" onClick={loadDevices}>Retry</PrimaryButton>} />}
      {loading && <StateBlock tone="loading" title="Loading Devices" description="Syncing heartbeat, version, and upload backlog." />}
      {!loading && devices.length === 0 && !error && (
        <StateBlock title="No Devices" description="Open the setup guide, copy the backend address to the Android device to complete registration." action={<PrimaryButton href="/setup">Open Setup Guide</PrimaryButton>} />
      )}

      {devices.length > 0 && (
        <>
          {/* Action Banner */}
          {offline.length > 0 || backlog > 0 ? (
            <div className="rounded-xl border border-secondary-container/40 bg-secondary-container/10 p-lg">
              <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-on-surface">
                    {offline.length > 0 ? `${offline.length} device(s) offline` : `${backlog} uploads backlogged`}
                  </div>
                  <div className="mt-xs max-w-2xl text-body-sm text-on-surface-variant">
                    {offline.length > 0 ? 'Next: check offline device details — network, backend address, foreground service.' : 'Next: check devices with backlog, wait for retransmission or check network.'}
                  </div>
                </div>
                <PrimaryButton href={offline[0] ? `/devices/${offline[0].device_id}` : '/devices'}>Investigate</PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-lg">
              <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-on-surface">All Systems Operational</div>
                  <div className="mt-xs max-w-2xl text-body-sm text-on-surface-variant">Next: continue monitoring or review events.</div>
                </div>
                <PrimaryButton href="/events">View Events</PrimaryButton>
              </div>
            </div>
          )}

          {/* 4-Stat Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            <MetricTile label="Total Vehicles" value="42,891" tone="brand" icon="directions_car" trend={{ value: '+12% from last hour', positive: true }} />
            <MetricTile label="Violations Detected" value="128" tone="warning" icon="warning" helper="Active tracking in 4 sectors" />
            <MetricTile label="Avg Response Time" value="03:42" icon="timer" helper="Dispatch to Arrival" />
            <MetricTile label="System Health" value="99.8%" tone="success" icon="monitoring" helper="All nodes operational" />
          </div>

          {/* Main: Camera Feed Grid + Incident Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg min-h-[calc(100vh-320px)]">
            {/* Camera Feed Grid — 2/3 width */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-gutter">
              {devices.slice(0, 3).map((dev) => (
                <Link key={dev.device_id} to={`/devices/${dev.device_id}`} className="relative rounded-xl overflow-hidden group border border-outline-variant/20">
                  <div className="absolute inset-0 bg-surface-container-lowest">
                    {/* Scanline pattern */}
                    <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(70,69,84,0.10) 2px, rgba(70,69,84,0.10) 4px)' }} />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <div className="absolute top-md left-md bg-black/60 backdrop-blur-md px-sm py-xs rounded text-label-xs flex items-center gap-xs z-10">
                    {dev.is_online ? (
                      <>
                        <span className="status-dot-critical" />
                        REC: {dev.device_id}
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-on-surface-variant" />
                        OFFLINE: {dev.device_id}
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-md left-md right-md flex justify-between items-center z-10">
                    <div className="text-label-xs">
                      <p className="font-bold text-on-surface">{dev.device_name}</p>
                      <p className={dev.is_online ? 'text-primary' : 'text-on-surface-variant'}>
                        {dev.is_online ? `FPS: ${dev.fps} · Battery: ${dev.battery_level}%` : 'Signal Lost'}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface/50 group-hover:text-primary transition-colors">fullscreen</span>
                  </div>
                </Link>
              ))}
              {/* Add Camera Placeholder */}
              <div className="relative rounded-xl overflow-hidden group border border-outline-variant/20 bg-surface-container flex items-center justify-center min-h-[200px]">
                <Link to="/setup" className="text-center space-y-md">
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl">add_circle</span>
                  <p className="text-label-xs text-on-surface-variant uppercase tracking-widest">Assign Source</p>
                </Link>
              </div>
            </div>

            {/* Incident Log Sidebar — 1/3 width */}
            <div className="bg-surface-container rounded-xl flex flex-col border border-outline-variant/10 min-h-0">
              <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-label-xs font-bold uppercase tracking-widest text-on-surface-variant">Incident Log</h3>
                <div className="flex gap-xs">
                  <span className="px-sm py-xs bg-secondary/20 text-secondary text-[10px] font-bold rounded-full">3 CRITICAL</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-sm space-y-sm">
                {[
                  { type: 'LANE VIOLATION', time: '14:22:10', loc: 'M25 North - Sector 4', desc: 'Unauthorized vehicle stopped in emergency lane for >3mins.', critical: true },
                  { type: 'DEBRIS DETECTED', time: '14:18:45', loc: 'A1(M) Southbound', desc: 'Object detected in Lane 1, migrating to Emergency Lane.', critical: false },
                  { type: 'Minor Alert', time: '14:05:22', loc: 'M11 Sector 12', desc: 'Weather alert: Heavy rain impacting visibility.', critical: false },
                ].map((incident, idx) => (
                  <div key={idx} className={`p-md rounded-lg border ${incident.critical ? 'glass-panel border-outline-variant/20 hover:border-primary/50' : 'border-outline-variant/10 hover:bg-surface-container-high'} transition-all ${idx === 2 ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-xs">
                      <span className={`text-label-xs font-bold ${incident.critical ? 'text-secondary' : 'text-primary'}`}>{incident.type}</span>
                      <span className="text-[10px] text-on-surface-variant">{incident.time}</span>
                    </div>
                    <p className="text-body-sm font-bold mb-xs">{incident.loc}</p>
                    <p className="text-label-xs text-on-surface-variant mb-md">{incident.desc}</p>
                    {idx < 2 && (
                      <div className="flex gap-xs">
                        <button className="flex-1 py-xs bg-primary text-on-primary text-[10px] font-bold rounded uppercase">Dispatch</button>
                        <button className="px-sm py-xs bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded uppercase">View</button>
                        <button className="px-sm py-xs hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Traffic Sparklines Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5">
              <p className="text-label-xs text-on-surface-variant mb-sm uppercase tracking-wider">Traffic Flow: M25 North</p>
              <div className="h-16 w-full flex items-end gap-1">
                {[60, 70, 65, 80, 75, 90, 95, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5">
              <p className="text-label-xs text-on-surface-variant mb-sm uppercase tracking-wider">Violation Trend: Sector 4</p>
              <div className="h-16 w-full flex items-end gap-1">
                {[40, 45, 60, 55, 85, 70, 50, 30].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm ${i === 4 ? 'bg-secondary shadow-[0_0_8px_#ffb5a0]' : 'bg-secondary/20'}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5 flex flex-col justify-center">
              <p className="text-label-xs text-on-surface-variant mb-sm uppercase tracking-widest">Global Status</p>
              <div className="flex items-center gap-md">
                <div className="flex -space-x-2">
                  {['JD', 'AM', 'SK'].map((initials, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] ${i === 0 ? 'bg-surface-bright' : i === 1 ? 'bg-primary-container' : 'bg-secondary-container'}`}>{initials}</div>
                  ))}
                </div>
                <p className="text-label-xs text-on-surface-variant">{onlineCount} Operators on duty</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend && bunx tsc -b --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DeviceStatus.tsx
git commit -m "feat: rebuild DeviceStatus to 1:1 match web_3 reference — camera feed grid, incident log sidebar, traffic sparklines"
```

---

### Task 10: Update remaining pages to Aegis theme

**Files:**
- Modify: `frontend/src/pages/EventList.tsx`
- Modify: `frontend/src/pages/ReviewQueue.tsx`
- Modify: `frontend/src/pages/Settings.tsx`
- Modify: `frontend/src/pages/Setup.tsx`
- Modify: `frontend/src/pages/Health.tsx`
- Modify: `frontend/src/pages/DeviceDetail.tsx`
- Modify: `frontend/src/components/EventTable.tsx`
- Modify: `frontend/src/components/EvidenceViewer.tsx`
- Modify: `frontend/src/components/ReviewPanel.tsx`
- Modify: `frontend/src/components/FilterBar.tsx`
- Modify: `frontend/src/components/Toast.tsx`

- [ ] **Step 1: Update each remaining page**

For each of the 6 pages: remove lucide-react imports, replace icon usages with Material Symbols `<span className="material-symbols-outlined">icon_name</span>`, update any hardcoded color references to Aegis token classes.

For each of the 5 components: same treatment — remove lucide-react, use Material Symbols, Aegis color tokens.

- [ ] **Step 2: Fix any remaining lucide-react imports across the codebase**

```bash
cd frontend && grep -r "lucide-react" src/ 2>/dev/null
```

Fix any remaining references.

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd frontend && bunx tsc -b --noEmit 2>&1
```

Expected: clean output, no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/ frontend/src/components/
git commit -m "feat: apply Aegis Traffic theme to all remaining pages and components — remove lucide-react, use Material Symbols"
```

---

### Task 11: Android app rebuild

**Files:**
- Modify: Android app layout and styling files to match `stitch_emergency_lane_sentinel/android/code.html`

- [ ] **Step 1: Rebuild Android main activity layout**

Match the android reference: Top App Bar (Aegis Traffic title, notification/settings icons, profile avatar), Status Summary (Active Tasks + Today's Cases cards), Map Integration section, Real-time Incident Feed with critical/urgent cards (Accept Task + video + navigation buttons), Bottom Navigation Bar (Feed/Alerts/Map/Account tabs).

- [ ] **Step 2: Apply Aegis dark theme to Android theme.xml**

```xml
<resources>
    <style name="Theme.AegisTraffic" parent="android:Theme.Material.NoActionBar">
        <item name="android:colorBackground">#13131b</item>
        <item name="android:textColorPrimary">#e4e1ed</item>
        <item name="android:colorPrimary">#c2c1ff</item>
        <item name="android:colorAccent">#ffb5a0</item>
        <item name="android:navigationBarColor">#2a2932</item>
        <item name="android:statusBarColor">#13131b</item>
    </style>
</resources>
```

- [ ] **Step 3: Commit**

```bash
git add android/
git commit -m "feat: rebuild Android app to match android reference — Aegis Traffic dark theme, task center layout"
```

---

### Task 12: Final verification

**Files:** (none — verification only)

- [ ] **Step 1: Verify frontend builds without errors**

```bash
cd frontend && bun run build 2>&1
```

Expected: `✓ built in Xms`

- [ ] **Step 2: Verify backend tests pass**

```bash
cd backend && uv run pytest tests/ -v 2>&1
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and verify visually**

```bash
cd frontend && bun run dev
```

Check:
- Dashboard renders with all sections (hero, stats grid, chart, hotspot, heatmap, leaderboard, glass overlay)
- EventDetail renders with evidence gallery, AI panel, timeline, actions
- DeviceStatus renders with camera grid, incident log, sparklines
- All other pages render without console errors
- Mobile bottom nav shows correctly
- Sidebar navigation works

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification fixes"
```
```

- [ ] **Step 2: Verify TypeScript compilation**
- [ ] **Step 3: Start dev server and verify visually**

Check all pages render correctly:
- Dashboard with analytics sections
- EventDetail with evidence gallery, AI panel, timeline
- DeviceStatus with camera feeds, incident log, sparklines
- Remaining pages with Aegis theme
- Mobile navigation works

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: apply Aegis Traffic theme to all remaining pages and components"
```

---

### Task 11: Update remaining auxiliary components

**Files:**
- Modify: `frontend/src/components/EventTable.tsx`
- Modify: `frontend/src/components/EvidenceViewer.tsx`
- Modify: `frontend/src/components/ReviewPanel.tsx`
- Modify: `frontend/src/components/FilterBar.tsx`
- Modify: `frontend/src/components/Toast.tsx`

- [ ] **Step 1: Update each component**

Read each file, replace any lucide-react imports with Material Symbols, update color references to use Aegis Tailwind token classes.

- [ ] **Step 2: Verify compilation**

```bash
cd frontend && bunx tsc -b --noEmit 2>&1
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: update remaining components to Aegis Traffic theme"
```

---

### Task 12: Android app rebuild

**Files:**
- Modify: Android layout XML, theme XML, Kotlin activities

- [ ] **Step 1: Rebuild main activity to match android/code.html**

Match: Top App Bar (Aegis Traffic, notification/settings/profile), Status cards (Active Tasks 03, Today's Cases 42 +12%), Map section with glass overlay, Incident cards (CRITICAL/URGENT with accept/video/navigation buttons), Bottom navigation (Feed/Alerts/Map/Account).

- [ ] **Step 2: Apply Aegis colors to Android theme**

Dark background #13131b, Neon Indigo primary #c2c1ff, Safety Orange secondary #ffb5a0.

- [ ] **Step 3: Commit**

```bash
git add android/
git commit -m "feat: rebuild Android app to match android reference design"
```

---

### Task 13: Final verification

**Files:** (none — verification only)

- [ ] **Step 1: Build frontend**

```bash
cd frontend && bun run build 2>&1
```

Expected: clean build.

- [ ] **Step 2: Run backend tests**

```bash
cd backend && uv run pytest tests/ -v 2>&1
```

Expected: all pass.

- [ ] **Step 3: Start dev server**

```bash
cd frontend && bun run dev
```

Visual check: all pages render, no console errors, matches reference designs.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A && git commit -m "chore: final verification and polish"
```

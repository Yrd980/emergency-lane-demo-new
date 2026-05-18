---
name: Aegis Traffic
description: Local emergency-lane detection workbench for setup, device health, evidence review, response tasks, and Android patrol flow.
colors:
  background: "#13131b"
  surface: "#13131b"
  surface-dim: "#13131b"
  surface-bright: "#393841"
  surface-container-lowest: "#0e0d15"
  surface-container-low: "#1b1b23"
  surface-container: "#1f1f27"
  surface-container-high: "#2a2932"
  surface-container-highest: "#34343d"
  on-surface: "#e4e1ed"
  on-surface-variant: "#c7c4d7"
  outline: "#918fa0"
  outline-variant: "#464554"
  primary: "#c2c1ff"
  on-primary: "#1800a7"
  primary-container: "#5e5ce6"
  on-primary-container: "#f4f1ff"
  secondary: "#ffb5a0"
  on-secondary: "#5f1500"
  secondary-container: "#d73b00"
  on-secondary-container: "#fffbff"
  tertiary: "#ffb786"
  on-tertiary: "#502400"
  tertiary-container: "#ae5600"
  on-tertiary-container: "#ffefe7"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "32px"
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  headline-md:
    fontFamily: "Inter"
    fontSize: "20px"
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: "-0.01em"
  body-sm:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: "0em"
  label-xs:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "1"
    letterSpacing: "0.02em"
  mono-data:
    fontFamily: "Space Grotesk"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1"
    letterSpacing: "0em"
rounded:
  sm: "0.25rem"
  DEFAULT: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  full: "9999px"
spacing:
  unit: "4px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  gutter: "16px"
  margin: "24px"
---

# Design System: Aegis Traffic

## 1. Overview

**Creative North Star: Precision Under Pressure**

Aegis Traffic is a dark-mode-first local operations product for emergency-lane detection. The interface should feel precise, vigilant, and controlled: setup status, device health, evidence sets, review queues, and response tasks dominate; visual treatment supports judgment without turning the product into a dramatic sci-fi dashboard.

The physical scene is an operator running a local backend and web console during a demo or long shift, while Android devices capture detections and patrol users handle assigned response tasks. That scene justifies the dark base, high-contrast text, compact controls, and sparse use of high-intensity color.

The visual language is minimalist-futuristic but functional. Deep violet-tinted charcoal surfaces create a quiet control-room canvas. Neon indigo marks active systems, primary actions, selected navigation, focus, and healthy live states. Safety orange is reserved for review warnings, high-priority suspected incidents, backlog, and intervention.

## 2. Colors

Use a restrained product palette: tinted dark neutrals carry the UI, indigo guides action and orientation, orange communicates urgency.

### Primary

- **Neon Indigo** (`#c2c1ff`, `#5e5ce6`): Primary actions, selected navigation, live/healthy indicators, focus rings, AI confidence, and active controls.
- **On Primary** (`#1800a7`, `#f4f1ff`): Text on primary buttons and strong primary containers.

### Alert And Severity

- **Safety Orange** (`#ffb5a0`, `#d73b00`): High-priority suspected incidents, review warnings, offline/backlog banners, critical badges, and urgent evidence metadata.
- **Tertiary Amber** (`#ffb786`, `#ae5600`): Secondary urgency such as urgent but non-critical patrol tasks.
- **Error Red** (`#ffb4ab`, `#93000a`): False alarm, destructive actions, failed validation, and system errors.

### Neutrals

- **Base Canvas** (`#13131b`, `#0e0d15`): Page background, sidebars, and deepest evidence surfaces.
- **Layered Panels** (`#1b1b23`, `#1f1f27`, `#2a2932`, `#34343d`): Cards, side panels, controls, mobile nav, and hover states.
- **Text Stack** (`#e4e1ed`, `#c7c4d7`, `#918fa0`): Primary text, secondary metadata, and subdued labels.
- **Fine Structure** (`#464554`): Borders, dividers, map outlines, and quiet panel separation.

### Rules

**The Alert Color Rule.** Orange is not decorative. Use it only when the user needs to notice review priority, severity, backlog, failure, or dispatch urgency.

**The Dark Surface Rule.** Never use pure black or pure white. Every neutral should remain softly tinted toward the product's violet-charcoal base.

**The Redundancy Rule.** Pair severity and priority color with text, icon, placement, and shape. Color alone is never enough.

## 3. Typography

Use **Inter** for interface text and **Space Grotesk** for technical data. The current web theme loads these as Tailwind v4 tokens, while Android mirrors the same color system in Compose. The type should feel engineered and legible rather than editorial.

- **Display Large:** Dashboard metrics and mobile summary numbers only.
- **Headline Medium:** Page titles, section headings, suspected incident IDs, and major panel titles.
- **Body Small:** Suspected incident descriptions, card text, helper copy, and navigation labels.
- **Label XS:** Uppercase metric labels, chips, camera tags, and compact metadata.
- **Mono Data:** Plate numbers, camera IDs, timestamps, coordinates, percentages, durations, and suspected incident IDs.

Use the current token tracking: display `-0.02em`, headline `-0.01em`, body and mono `0em`, labels `0.02em`. Do not scale fonts with viewport width.

## 4. Layout

Desktop uses a persistent left sidebar, a top control bar, a dense main work area, and context-specific panels. Mobile uses a fixed top bar, task-summary cards, a compact map/status preview, suspected incident cards, and a bottom navigation dock where available.

### Desktop Patterns

- **Dashboard:** Local operations loop hero, system status pills, setup/review/health next action, report export, operational filters, metrics, trends, hotspots, time distribution, and operator performance.
- **Review Queue:** Pending suspected incident queue, bulk review controls, queue metrics, and a primary "Process Next" path.
- **Incident Log:** Searchable/filterable suspected incident history with review state, confidence, thumbnail, pagination, and review entry points.
- **Incident Detail:** Evidence viewer and snapshots on the left, detection metadata, timeline, location, review history, and review/assignment actions on the right.
- **Devices / Live Feed:** Device cards, online/offline state, upload backlog, thermal/fps/battery metrics, and assign-source/setup entry.
- **Health:** Backend, database, evidence directory, devices, and suspected incident readiness with next actions.
- **Settings:** Review policy, online detection window, evidence retention, and device access settings, including read-only role behavior.
- **Setup:** Backend address copying, onboarding steps, and observable readiness checks for Android registration.

### Mobile Patterns

- **Android Detection:** Camera, ROI calibration, suspected incident queue, backend address settings, and upload behavior.
- **Android Patrol Task Center:** Active task count, today's validated incidents, nearest/task context, response task cards, accept/complete task actions, and field-friendly touch targets.

### Spacing

Use the 4px baseline grid. Page margins are 24px on desktop and should compress to 16px or less on small mobile surfaces. Repeated content grids use 16px gutters. Major panels use 16px to 24px internal padding depending on density.

## 5. Elevation

Depth comes from tonal layering, borders, and evidence imagery, not heavy shadows. Use 1px borders with low-opacity outline colors for most panels. Blur treatment is allowed for overlays on top of video, camera feeds, maps, or current implementation menus where preserving context matters.

Avoid decorative glass panels in ordinary cards. Avoid large ambient glows except small status dots or live indicators.

## 6. Components

### Navigation

Sidebar items use icon plus label. Active items currently combine indigo text, a darker filled row, stronger text weight, and a narrow right-edge indicator. Future navigation polish should preserve the full-row active contrast and avoid relying on the indicator alone.

### Buttons

Primary buttons use indigo or primary-container fills with high-contrast text and a minimum comfortable hit area. Core actions should be verb-led: "Start Device Setup", "Process Next", "Dispatch", "Validate Incident", "Assign to Patrol", "Accept Task", "Complete Task", "Copy Backend Address", "Retry". Secondary buttons use tonal fills or 1px borders. Destructive or dismissive actions must stay visually secondary unless they are the confirmed intent.

### Status Chips

Use compact rounded chips for `Network Active`, `LIVE`, `pending`, `validated`, `false_alarm`, `assigned`, `accepted`, `completed`, `online`, `offline`, `high_priority`, and `normal_priority`. Chips should include text and, where helpful, a small icon or dot.

### Evidence Cards

Camera cards and suspected incident evidence tiles are media-first when real media exists. Device feed placeholders may use scanline/grid patterns only to communicate unavailable or simulated feed state. Use overlays only for camera ID, live/offline state, detected state, location, metrics, and open controls. Preserve image clarity; do not bury evidence under decorative gradients beyond legibility overlays.

### AI Recognition Panel

Recognition data should be grouped in a compact grid: track or plate identifier, confidence, vehicle class, GPS/ROI, and timestamp. Technical values use Space Grotesk. Confidence can use indigo only when it is a positive system-confidence signal.

### Incident Timeline

Timeline entries use time first, action second. Detection, alert, incident review, assignment, acceptance, completion, and rejection steps should use consistent markers. Completed steps use indigo markers, warning steps use orange, rejected/failed steps use error, and pending steps use muted markers. Include exact times for auditability.

### Analytics

Charts should be subdued and readable. Use indigo for system trends and validated incident data, orange/red only for high-priority review work, backlog, or failure. Heatmaps may use indigo intensity ramps, but legends must be visible and labels compact. Dashboard charts should remain linked to the real backend `OperationsStats` shape rather than decorative telemetry.

## 7. Motion

Motion is subtle and operational. Use quick ease-out transitions for hover, active, focus, and card selection. Status pulses are allowed for live recording and critical feeds, but should be small and non-distracting. Respect reduced motion preferences.

Recommended easing: `cubic-bezier(0.22, 1, 0.36, 1)`.

## 8. Do's And Don'ts

### Do

- Do make evidence, location, confidence, and next action visible together.
- Do make local setup, health, device state, upload backlog, and evidence completeness visible when they affect trust.
- Do reserve orange for real urgency or high review priority.
- Do use indigo for orientation, primary action, and healthy live states.
- Do keep desktop dense but scannable.
- Do keep mobile cards large enough for field use.
- Do use exact timestamps, IDs, and technical values in Space Grotesk.
- Do make false-alarm and validation paths clear.
- Do preserve role-aware behavior for admin, reviewer, dispatcher, and patrol.

### Don't

- Don't create marketing heroes or explanatory landing-page sections.
- Don't use decorative cyberpunk glow, fake telemetry, or ornamental maps.
- Don't use gradient text.
- Don't rely on color alone for severity or review priority.
- Don't stack cards inside cards when a split panel or list would be clearer.
- Don't blur or darken evidence so much that the suspected incident cannot be inspected.
- Don't imply automatic legal enforcement beyond validation, dispatch, and review workflow.
- Don't imply cloud multi-tenancy, enforced device tokens, or external law-enforcement integration unless implemented.

---
name: LaneOps
description: Calm local operations workbench for emergency-lane detection review and system health.
colors:
  shell-ink: "#0f1720"
  evidence-ink: "#0b1118"
  text-primary: "#020617"
  text-secondary: "#475569"
  text-muted: "#64748b"
  app-bg-high: "#f4f6f8"
  app-bg-mid: "#eef2f4"
  app-bg-low: "#e9eef1"
  surface: "#ffffff"
  surface-muted: "#f8fafc"
  surface-subtle: "#f1f5f9"
  border: "#e2e8f0"
  border-strong: "#cbd5e1"
  primary-accent: "#22d3ee"
  primary-accent-deep: "#0e7490"
  warning-bg: "#fffbeb"
  warning-text: "#92400e"
  success-bg: "#ecfdf5"
  success-text: "#065f46"
  danger-bg: "#fff1f2"
  danger-text: "#9f1239"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2.7rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger-text}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  card-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
  input-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "38px"
  status-chip:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: LaneOps

## 1. Overview

**Creative North Star: "The Local Control Room"**

LaneOps should feel like a calm, reliable, professional control surface installed on a local machine. It is not a marketing object and not a visual spectacle. The interface earns trust by making state, evidence, and next actions easy to scan under real operating conditions.

The visual system is intentionally quiet: slate-tinted backgrounds, white work surfaces, a dark shell for navigation, and a single cyan accent for orientation and focus. The result should feel stable under repeated use, not attention-seeking on first glance. Density is medium-high, because the product is a working tool, not a brochure.

This system explicitly rejects PRODUCT.md's anti-references: "一次性 demo 页面", "泛后台 CRUD 模板", "营销页式大 hero", and "花哨科技大屏". If a screen starts to feel like a sales page or a decorative command center, it has drifted away from the product.

**Key Characteristics:**

- Calm operational shell with clear hierarchy and stable headers.
- Evidence and state take priority over decoration.
- White panels sit on softly tinted app backgrounds.
- Cyan is an orientation accent, not a theme.
- Empty, error, loading, and success states always suggest a next action.

## 2. Colors

The palette is restrained and operational. Slate neutrals carry almost every surface, cyan guides attention, and semantic colors are reserved for system state.

### Primary

- **Signal Cyan** (#22d3ee): The only decorative accent. Use for focus rings, selected items, page eyebrows, and the shell logo mark.
- **Control-Room Ink** (#0f1720): The desktop side rail and dark evidence canvas. It should read as steady and grounded.

### Secondary

- **Warning Amber** (#fffbeb / #92400e): Pending review, incomplete setup, and non-blocking issues.
- **Operational Emerald** (#ecfdf5 / #065f46): Online, confirmed, ready, and success states.
- **Incident Rose** (#fff1f2 / #9f1239): Rejected events, destructive actions, critical issues, and failed submission feedback.

### Neutral

- **Fogged Workbench** (#f4f6f8 -> #eef2f4 -> #e9eef1): The app background. It keeps the interface light without becoming sterile.
- **Panel White** (#ffffff): Primary work surface for cards, tables, forms, and review panes.
- **Soft Slate** (#f8fafc / #f1f5f9): Nested utility blocks, subtle panels, and helper zones.
- **Slate Text Stack** (#020617 / #475569 / #64748b): Primary text, secondary text, and metadata.
- **Fine Divider** (#e2e8f0 / #cbd5e1): Structural borders instead of decorative stripes.

### Named Rules

**The One Accent Rule.** Cyan is the only brand accent. Never introduce a second decorative color family.

**The Semantic Color Rule.** Amber, emerald, and rose are state colors only. They must not be used for ornament.

## 3. Typography

**Display Font:** Inter / system sans stack.
**Body Font:** Inter / system sans stack.
**Label/Mono Font:** ui-monospace stack for event IDs, device IDs, and technical identifiers.

**Character:** The typography is compact, technical, and direct. It should read like an operations product, not a publication and not a SaaS brochure.

### Hierarchy

- **Display** (600, 2.7rem, 1.08): Dashboard hero only.
- **Headline** (600, 2.1rem, 1.15): Page titles in `PageHeader`.
- **Title** (600, 1rem, 1.5): Section headings, panel headings, and important inline labels.
- **Body** (400, 0.875rem, 1.5): Descriptions, helper copy, table cells, and longer prose. Keep paragraphs within 65 to 75 characters.
- **Label** (600, 0.6875rem, 0.16em, uppercase): Eyebrows, metric labels, and compact operational labels.
- **Mono** (600, 0.75rem, normal): IDs and exact values.

### Named Rules

**The No Brochure Type Rule.** Never scale type with viewport width and never use oversized marketing typography inside small panels.

**The Identifier Rule.** Exact IDs, timestamps, and other technical values should use mono styling so they remain visually distinct.

## 4. Elevation

LaneOps uses tonal layering and fine borders first, then small shadows for separation. Surfaces should feel placed on a workbench, not floating in a showroom. Hover elevation is allowed for interactive cards; static panels should remain mostly flat.

### Shadow Vocabulary

- **Surface Low** (`0 1px 2px rgba(15, 23, 42, 0.05)`): Default cards, filters, metrics, and forms.
- **Interactive Medium** (`0 4px 6px rgba(15, 23, 42, 0.10)`): Hover state for clickable cards.
- **Mobile Dock** (`0 -8px 24px rgba(15, 23, 32, 0.08)`): Bottom mobile navigation only.

### Named Rules

**The Border-First Rule.** Use a 1px slate border before any shadow. If a panel needs a heavy shadow to read, the composition is too decorative.

## 5. Components

### Buttons

- **Shape:** Compact rounded rectangle with a 6px radius.
- **Primary:** Near-black fill, white text, 40px minimum height, 16px horizontal padding. Use for the main action.
- **Hover / Focus:** Slight darkening on hover. Cyan focus ring with visible offset on all variants.
- **Secondary / Light:** White fill with slate border and slate text. Use for navigation, return, and non-primary actions.
- **Danger:** Rose fill with white text. Use only for destructive or negative review actions.

### Chips

- **Style:** Rounded pill, 1px border, small filled dot, 11px semibold text, semantic background.
- **State:** Status chips must combine text, shape, and color. Never rely on color alone.

### Cards / Containers

- **Corner Style:** 6px default, 8px only for large media or legacy toast surfaces.
- **Background:** White for work panels, slate-50 for nested cells and empty hints, dark slate for shell and evidence canvas.
- **Shadow Strategy:** Surface Low at rest, Interactive Medium on hoverable cards.
- **Border:** 1px slate border is standard. Dashed borders are reserved for missing evidence or empty states.
- **Internal Padding:** 16px for most panels, 24px to 32px for major dashboard bands.

### Inputs / Fields

- **Style:** White background, 1px slate border, 6px radius, compact padding.
- **Focus:** Cyan border plus a soft cyan ring.
- **Error / Disabled:** Error surfaces use rose tint and rose text. Disabled controls lower opacity but remain legible.

### Navigation

- **Desktop:** Fixed 18rem dark side rail, white active item, slate inactive text, compact icon-plus-label rows.
- **Mobile:** Sticky top header plus a five-item bottom navigation for the most common routes.
- **Active State:** Active items use contrast, not color alone.

### Evidence Viewer

The evidence viewer is the most visually distinct component. It uses a dark canvas for media inspection and white side panels for completeness and media selection. The canvas must stay quiet, because evidence itself is the focus.

### Tables And Event Cards

Desktop events use a compact table with thumbnails, mono IDs, chips, and a right-aligned next action. Mobile events become full-width cards with the same metadata sequence. Both variants should preserve the same review intent.

## 6. Do's and Don'ts

### Do:

- **Do** keep this as a product UI, not a brand page.
- **Do** make the header, description, and primary action legible on every page.
- **Do** show a next step for loading, empty, error, success, and partial data states.
- **Do** keep cyan rare and meaningful.
- **Do** use semantic colors only for state.
- **Do** keep cards at 6px radius with 1px slate borders and low shadows.
- **Do** use mono styling for event IDs and device IDs.
- **Do** keep mobile event browsing card-based and preserve the bottom navigation.

### Don't:

- **Don't** make it look like a "一次性 demo 页面".
- **Don't** make it look like a "泛后台 CRUD 模板".
- **Don't** use a "营销页式大 hero" for ordinary app pages.
- **Don't** make a "花哨科技大屏" with decorative glow, neon, fake telemetry, or theatrical gradients.
- **Don't** use gradient text, glassmorphism, colored side-stripe borders, or repeated identical marketing card grids.
- **Don't** use large decorative numbers without a clear operational next action.
- **Don't** imply automatic punishment, law-enforcement integration, cloud multi-tenancy, or complex account permissions unless implemented.
- **Don't** communicate critical state by color alone.

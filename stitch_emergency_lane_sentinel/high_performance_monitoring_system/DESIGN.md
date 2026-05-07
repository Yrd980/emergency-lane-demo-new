---
name: High-Performance Monitoring System
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393841'
  surface-container-lowest: '#0e0d15'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#2a2932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#302f38'
  outline: '#918fa0'
  outline-variant: '#464554'
  surface-tint: '#c2c1ff'
  primary: '#c2c1ff'
  on-primary: '#1800a7'
  primary-container: '#5e5ce6'
  on-primary-container: '#f4f1ff'
  inverse-primary: '#4d4ad5'
  secondary: '#ffb5a0'
  on-secondary: '#5f1500'
  secondary-container: '#d73b00'
  on-secondary-container: '#fffbff'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#ae5600'
  on-tertiary-container: '#ffefe7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1ff'
  on-primary-fixed: '#0c006b'
  on-primary-fixed-variant: '#332dbc'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb5a0'
  on-secondary-fixed: '#3b0900'
  on-secondary-fixed-variant: '#862200'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#723600'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  mono-data:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin: 24px
---

## Brand & Style

This design system is engineered for power users who require absolute precision and clarity in high-density data environments. It adopts a **Minimalist-Futuristic** aesthetic, heavily influenced by the "Linear" methodology—prioritizing speed of thought and action over decorative elements.

The visual language balances **Dark-Mode-First** depth with high-contrast functional elements. By utilizing **Glassmorphism** for utility layers and tight, purposeful typography, the interface recedes to let the data lead, only surfacing with high-intensity color when human intervention is required. The brand personality is unapologetically professional: it is a reliable tool for experts who value efficiency and performance.

## Colors

The palette is built on a foundation of deep grays to minimize eye strain during long-duration monitoring.

- **Primary (Neon Indigo):** Used for primary actions, active states, and system-healthy notifications. It provides a futuristic, calm, yet high-visibility signal.
- **Secondary (Safety Orange):** Reserved exclusively for alerts, warnings, and critical data points. Its use must be sparse to maintain its psychological impact.
- **Neutrals:** The background (#0D0D0D) and surface (#1A1A1A) levels create a "layered ink" effect. Borders (#2E2E2E) should be used minimally, often replaced by tonal differences.
- **Light Mode Variant:** For the light mode, the background flips to #FFFFFF, surfaces to #F5F5F7, and borders to #E5E5E5. Typography shifts to #0D0D0D for maximum legibility.

## Typography

This design system utilizes **Inter** for all UI elements to ensure neutrality and readability. **Space Grotesk** is introduced as a secondary mono-variant for technical data strings, IP addresses, and timestamps to provide a subtle technical "edge."

The hierarchy is strictly functional. Headlines use tight tracking (-0.02em) to feel compact and "engineered." Body text prioritizes vertical rhythm, while labels use uppercase or medium weights to differentiate from dynamic content.

## Layout & Spacing

A **4px baseline grid** governs all elements, ensuring a rhythmic, predictable flow. The layout uses a **Fluid Grid** model for dashboard views, allowing data visualizations to expand and fill the viewport, but transitions to a **Fixed Sidebar/Dynamic Content** model for administrative tasks.

Margins are kept generous (24px) to provide "breathing room" in a high-density environment. Internal component padding should follow the "tight-outside, tighter-inside" rule: 16px for card containers, 8px for internal groupings.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

1.  **Level 0 (Base):** #0D0D0D. The canvas.
2.  **Level 1 (Cards/Panels):** #1A1A1A. Used for the main workspace modules.
3.  **Level 2 (Modals/Popovers):** A translucent #2E2E2E (80% opacity) with a 20px backdrop blur. This creates a "glass" overlay that maintains the context of the data underneath.
4.  **Stroke Elevation:** Instead of shadows, use 1px inner borders (#FFFFFF at 5% opacity) on the top edge of components to simulate a subtle catch-light.

## Shapes

The shape language is sophisticated and controlled. A standard **0.5rem (8px)** radius is applied to all primary containers and buttons. For larger layout blocks or dashboard cards, use **1rem (16px)** to soften the technical density.

Interactive elements (buttons, inputs) must maintain consistent corner radii to reinforce clickability. Icons should be framed in square or slightly rounded enclosures, never circles, to maintain the "grid-aligned" professional feel.

## Components

- **Buttons:** High-contrast primary buttons use the Neon Indigo background with white text. Secondary buttons use a ghost style (1px border, no fill) or a subtle #2E2E2E fill. Use "tight" padding: 8px vertical, 16px horizontal.
- **Status Chips:** Small, pill-shaped indicators. "Healthy" uses a 2px indigo dot; "Critical" uses a solid Safety Orange background with black text.
- **Input Fields:** Dark background (#0D0D0D) with a 1px border (#2E2E2E). On focus, the border transitions to Neon Indigo with a subtle outer glow (0px 0px 4px indigo).
- **Data Tables:** Borderless design. Rows are separated by subtle tonal changes on hover. Use Space Grotesk for numerical values to ensure digit alignment.
- **Icons:** Monochromatic, 1.5px stroke weight. Avoid solid fills unless indicating an active toggle state.
- **Monitoring Graphs:** Vector-based lines with a 2px stroke. Fill the area under the line with a subtle gradient (Indigo to Transparent) to create volume without clutter.
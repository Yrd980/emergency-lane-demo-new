---
name: Aegis Traffic Monitoring System
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

This design system supports an operations console for suspected emergency-lane occupation. It prioritizes evidence, incident review, device health, and response tasks over decorative command-center styling.

The visual language balances **Dark-Mode-First** depth with high-contrast functional elements. Utility layers should stay quiet so evidence sets, review priority, system health, and response task state remain the strongest signals.

## Colors

The palette is built on deep violet-charcoal neutrals to minimize eye strain during long-duration monitoring.

- **Primary (Neon Indigo):** Used for primary actions, active states, selected navigation, and system-healthy notifications.
- **Secondary (Safety Orange):** Reserved for warnings, backlog, high-priority review work, and intervention.
- **Neutrals:** The background and surface levels create a layered operating canvas. Borders should be subtle and functional.

## Typography

Use **Inter** for all UI elements and **Space Grotesk** for technical data strings, IDs, coordinates, percentages, durations, IP addresses, and timestamps.

The hierarchy is strictly functional. Headlines use tight tracking to feel compact and engineered. Body text prioritizes vertical rhythm, while labels use uppercase or medium weights to differentiate from dynamic content.

## Layout & Spacing

A **4px baseline grid** governs all elements, ensuring a rhythmic, predictable flow. Dashboard views should support dense scanning without turning every metric into a repeated card.

Margins are 24px on desktop and tighter on mobile surfaces. Internal component padding should reflect density: 16px for most panels, 8px for compact internal groupings.

## Elevation & Depth

Depth is achieved through tonal layering, borders, and evidence imagery rather than traditional heavy shadows.

1. **Level 0 (Base):** Deep violet-charcoal canvas.
2. **Level 1 (Panels):** Main workspace modules.
3. **Level 2 (Popovers):** Contextual utility layers, used only when they preserve the current work surface.
4. **Stroke Elevation:** Use subtle 1px borders or tonal differences before shadows.

## Shapes

Use a controlled shape language. A standard **0.5rem (8px)** radius is applied to primary containers and buttons. Interactive elements must maintain consistent corner radii to reinforce clickability.

## Components

- **Buttons:** Primary buttons use Neon Indigo with high-contrast text. Secondary buttons use a subtle filled or bordered style.
- **Status Chips:** Use text, icon/dot, placement, and color together. "High Priority" uses Safety Orange; "Healthy" uses indigo.
- **Input Fields:** Dark surface with a subtle border. On focus, transition to Neon Indigo.
- **Data Tables:** Favor scanability, stable columns, and technical values in Space Grotesk.
- **Icons:** Monochromatic, consistent stroke weight. Avoid solid fills unless indicating an active toggle state.
- **Monitoring Graphs:** Use subdued lines and legends. Reserve orange/red for high-priority review work, backlog, or failure.

---
name: Nexus Operational Intelligence
colors:
  surface: '#fcf9f7'
  surface-dim: '#dcd9d8'
  surface-bright: '#fcf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f1'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e0'
  on-surface: '#1c1b1b'
  on-surface-variant: '#454843'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#757872'
  outline-variant: '#c5c7c1'
  surface-tint: '#5c5f5a'
  primary: '#0a0d09'
  on-primary: '#ffffff'
  primary-container: '#20231f'
  on-primary-container: '#888a85'
  inverse-primary: '#c5c7c1'
  secondary: '#2d6955'
  on-secondary: '#ffffff'
  secondary-container: '#b1f0d6'
  on-secondary-container: '#336f5b'
  tertiary: '#100b0c'
  on-tertiary: '#ffffff'
  tertiary-container: '#272122'
  on-tertiary-container: '#918789'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e3dd'
  primary-fixed-dim: '#c5c7c1'
  on-primary-fixed: '#191c19'
  on-primary-fixed-variant: '#454843'
  secondary-fixed: '#b1f0d6'
  secondary-fixed-dim: '#96d3bb'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#0e503e'
  tertiary-fixed: '#ece0e1'
  tertiary-fixed-dim: '#cfc4c5'
  on-tertiary-fixed: '#201a1b'
  on-tertiary-fixed-variant: '#4c4546'
  background: '#fcf9f7'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e0'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 32px
  gutter: 24px
  card-padding: 24px
  stack-gap: 16px
---

## Brand & Style

This design system embodies a "Warm Industrial" aesthetic—a fusion of high-precision operational data with a premium, tactile physical presence. The target audience consists of high-level operators and decision-makers who require clarity without the coldness of traditional enterprise software.

The UI leverages **Spatial Minimalism** with a **Tactile** twist. It avoids the flat, clinical look of standard SaaS in favor of subtle depth, soft geometry, and architectural layering. The emotional response is one of calm authority, reliability, and precision. Surfaces should feel like high-quality physical materials—sandblasted glass, matte polymers, and warm paper—creating an environment that reduces cognitive load during high-stakes monitoring.

## Colors

The palette is anchored by organic, warm neutrals rather than pure grays or blacks. 

- **Foundation:** The background (`#F7F5EF`) provides a soft, paper-like canvas. Surfaces (`#FFFDF8`) are slightly brighter to "lift" content areas.
- **Typography:** Deep obsidian (`#20231F`) ensures maximum legibility while maintaining a natural feel. 
- **Semantics:** Color is used functionally. The semantic palette is desaturated enough to feel integrated into the premium aesthetic but distinct enough to signal operational status immediately. 
- **AI & Simulation:** Purple and Lavender are reserved strictly for non-deterministic data—projections, simulations, and AI-generated insights—to distinguish them from real-time telemetry.

## Typography

The typography system prioritizes high-speed scanning and data integrity. 

- **Primary Typeface:** **Geist** is used for all UI elements and headings. Its clean, technical geometry supports the professional tone while remaining highly legible in dense layouts.
- **Secondary Typeface:** **JetBrains Mono** (or a similar high-quality monospaced font) is utilized for labels, technical telemetry, and data values. This ensures that changing numbers do not cause layout shifts and underscores the platform's "operational" nature.
- **Hierarchy:** Use generous leading (line height) to maintain the airy, premium feel. Labels should always be distinct—using uppercase and monospaced styling to separate metadata from primary content.

## Layout & Spacing

The layout is built on a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile. 

- **Rhythm:** A 4px base unit governs all spacing. 
- **Whitespace:** Emphasize "Generous Breathing Room." Components should not feel crowded; utilize the `container-margin` to create a centered, focused workspace on ultra-wide displays.
- **Density:** While the overall system is "airy," data-heavy panels can utilize a tighter spacing scale (8px gaps) if they are contained within a clear, large-margin card.
- **Breakpoints:** 
  - Mobile: < 768px (Sidebars become bottom sheets)
  - Tablet: 768px - 1280px (Condensed sidebars)
  - Desktop: 1280px+ (Full layout)

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Soft Ambient Shadows**. Avoid heavy black shadows.

1.  **Level 0 (Base):** Background color (`#F7F5EF`).
2.  **Level 1 (Cards/Panels):** Surface color (`#FFFDF8`) with a subtle 1px border (`#E5E2D9`) and a very soft, diffused shadow: `0px 4px 20px rgba(32, 35, 31, 0.04)`.
3.  **Level 2 (Active/Hover):** Increased shadow spread and a slight 2px vertical lift to indicate interactability.
4.  **Overlays:** For modals and dropdowns, use a **Glassmorphic** effect: Surface color at 85% opacity with a 12px backdrop-blur. This maintains the "Spatial" feel, allowing the operator to keep the context of the underlying data.

## Shapes

The shape language is defined by **Soft Geometry**. 

- **Primary Containers:** Large containers and dashboard cards use `rounded-xl` (1.5rem / 24px) to create the signature "architectural" feel.
- **UI Elements:** Buttons, input fields, and chips use the standard `rounded-lg` (1rem / 16px).
- **Icons:** Should follow a 2px stroke weight with rounded terminals to match the typography and corner radii.
- **Interactions:** Use "squishy" transitions—subtle scale transforms (98%) on press to reinforce the tactile nature of the platform.

## Components

- **Tactile Cards:** Every major functional group must be housed in a card. Cards should have a clear title section using `label-caps` and `data-mono` for quick status summaries in the top-right corner.
- **Buttons:** 
  - *Primary:* Solid `#20231F` with white text. 
  - *Secondary:* Ghost style with `#F1EEE6` background on hover. 
  - *Semantic:* Low-opacity background tints (e.g., 10% Green for "Healthy") with high-contrast text.
- **Inputs:** Fields should have a subtle inset shadow to feel "pressed" into the surface, utilizing the `#F1EEE6` surface color.
- **Semantic Labels:** Use "pill" shapes with monospaced text. The background color should be a 15% tint of the semantic color, with the text being the full-strength hex.
- **Status Indicators:** Small, glowing "LED" style circles. For "Critical" states, include a subtle 4px outer glow in the red hex to draw immediate attention without flashing.
- **Simulation Overlays:** Use a dashed border treatment and the Purple/Lavender palette to distinguish "what-if" scenarios from actual system states.
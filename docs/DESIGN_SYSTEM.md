# NEXUS Design System — Warm Industrial & Spatial Minimalism

This document defines the design language, chromatic palette, spatial typography, motion physics, and component specifications implemented across the NEXUS platform.

---

## 1. Aesthetic Foundations

NEXUS bridges high-density operational logistics with high-craft digital design:

- **Warm Industrial Canvas**: Replaces sterile cold blues and stark white monochrome with a warm, tactile foundation (`#FCF9F7` / `hsl(30, 20%, 98%)`) reminiscent of architectural drafting paper and matte aerospace composites.
- **High-Legibility Obsidian Typography**: Deep warm grey typography (`#20231F`) calibrated for long dispatch shifts, minimizing eye fatigue while maintaining optimal contrast.
- **Functional Semantics**: Strict chromatic boundaries ensure rapid, unambiguous status assessment:
  - **Nominal Telemetry**: Muted Forest / Emerald tones (`#1B4D3E`).
  - **Caution & Elevation**: Warm Amber & Honey tones (`#D97706`).
  - **Critical SLA Risks**: High-visibility Crimson (`#BA1A1A`).
  - **Hypothetical What-If Scenarios**: Amethyst Violet & Lavender (`#7B2CBF` / `#E8DCF0`), visually segregating simulations from real-world telemetry.
- **Tactile Depth**: Layering achieved through delicate borders (`1px solid #E8DFDC`) and diffuse ambient occlusion rather than harsh drop shadows.

---

## 2. Color Token Hierarchy

The platform color tokens are declared in `frontend/styles/tokens.css` and mapped through `frontend/tailwind.config.ts`:

| Token Name | Hex Code | HSL Value | Semantic Operational Usage |
| :--- | :--- | :--- | :--- |
| `nexus-surface` | `#FCF9F7` | `hsl(30, 20%, 98%)` | Primary application canvas and page background |
| `nexus-surface-container` | `#F2ECE9` | `hsl(24, 22%, 93%)` | Table headers, secondary toolbars, card backgrounds |
| `nexus-surface-container-high` | `#E8DFDC` | `hsl(18, 20%, 88%)` | Active drawers, modal surfaces, highlighted card borders |
| `nexus-on-surface` | `#20231F` | `hsl(80, 7%, 13%)` | Primary headlines, metric values, high-contrast labels |
| `nexus-on-surface-variant` | `#5C6058` | `hsl(86, 4%, 36%)` | Secondary descriptions, timestamps, inactive tabs |
| `nexus-primary` | `#1B4D3E` | `hsl(162, 48%, 21%)` | Primary action buttons, active navigation indicators |
| `nexus-secondary` | `#7D5260` | `hsl(339, 21%, 41%)` | Telemetry tags, secondary button fills |
| `nexus-lavender` | `#E8DCF0` | `hsl(278, 43%, 90%)` | Simulation workspace backdrops & comparison cards |
| `nexus-lavender-dark` | `#7B2CBF` | `hsl(272, 62%, 46%)` | Simulation badges, ghost route splines, what-if controls |
| `nexus-critical` | `#BA1A1A` | `hsl(0, 75%, 42%)` | Critical SLA breaches, road blockages, urgent incident badges |
| `nexus-emerald` | `#059669` | `hsl(160, 84%, 31%)` | Healthy connection states, nominal battery, on-time arrivals |
| `nexus-amber` | `#D97706` | `hsl(37, 91%, 44%)` | Weather warnings, battery warnings (< 25%), congestion |

---

## 3. Typography Scale & Font Architecture

NEXUS pairs **Geist Sans** for UI navigation and executive clarity with **JetBrains Mono** for numerical precision:

| Typography Role | Typeface | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | Geist Sans | 48px | SemiBold (600) | 56px | -0.02em |
| **Section Headline** | Geist Sans | 32px | SemiBold (600) | 40px | -0.01em |
| **Card Title** | Geist Sans | 20px | Medium (500) | 28px | Normal |
| **Body Text** | Geist Sans | 15px | Regular (400) | 24px | Normal |
| **Data Mono** | JetBrains Mono | 14px | Regular (400) | 20px | Normal |
| **Label Caps** | JetBrains Mono | 11px | Medium (500) | 16px | +0.05em |
| **Telemetry Badge** | JetBrains Mono | 12px | SemiBold (600) | 16px | +0.02em |

All changing telemetry counters, vehicle coordinates, battery percentages, and timestamps use `font-mono` to prevent horizontal layout jitter during real-time updates.

---

## 4. Tactile Motion & Spring Physics

All user interactions adhere to physical spring mechanics implemented via `motion/react`:

### Interaction Parameters:
- **Card Tap Compression**: `whileTap={{ scale: 0.985 }}` providing instant tactile feedback.
- **Elevation Physics**: `transition={{ type: "spring", stiffness: 400, damping: 25 }}`.
- **Container Stagger**: Child elements stagger in with `0.04s` delay intervals.
- **Reduced Motion Compliance**: Evaluates `window.matchMedia("(prefers-reduced-motion: reduce)")`. When enabled, transforms collapse to instant opacity fades.

### Core Motion Components (`frontend/components/motion/`):
- `FadeIn`: Directional entry reveals with hardware-accelerated transforms.
- `SpringCard`: Tactile elevation cards with subtle border illumination on hover.
- `StaggerList` & `StaggerItem`: Orchestrated list item entrances.
- `NumberTransition`: Spring-animated counter transitioning between live numerical values.
- `ScrollStory`: Viewport-pinned 7-stage scrollytelling component.

---

## 5. 3D Companion Avatar & Spatial Systems

### 5.1 Procedural Avatar (`Avatar3D.tsx`)
A procedural WebGL companion rendered via React Three Fiber that reflects the real-time operational status of the workspace.

#### Mood Priority Hierarchy:
```
CRITICAL > ERROR > WARNING > SIMULATING > THINKING > SUCCESS > FOCUSED > WELCOME > EMPTY > OFFLINE > IDLE
```

#### Avatar Features:
- **Cursor Gaze Lerp**: Avatar eye orientation smoothly interpolates toward normalized mouse coordinates `(x, y)` on the screen.
- **Mood Glow Beacon**: Luminous ring around the avatar base pulses with the current mood color token.
- **Procedural Sound Sync**: Mood changes trigger micro-audio cues generated by the procedural Web Audio synthesizer.

### 5.2 Interactive 3D World (`NexusWorld.tsx`)
- High-performance MapLibre GL 3D vector map engine.
- Renders dynamic vehicle GPS points, speed vectors, highway corridor splines, and Open-Meteo weather hazard polygons.
- Procedural camera flight controllers for spoken commands (e.g., *"Fly map to Denver hub"*).

---

## 6. Component Catalog & Tactical HUD

### Key UI Components (`frontend/components/ui/` & `layout/`):
- **`AppShell.tsx`**: Monolithic workspace container featuring breadcrumb trails, tenant switcher, tactical search, avatar integration, and live SSE connection pulse.
- **`NexusPulse.tsx`**: Real-time heartbeat component displaying backend connectivity, stream latency, and live socket status.
- **`StateViews.tsx`**: Standardized, branded templates for `EmptyState`, `LoadingState`, `ErrorState`, and `OfflineState`.
- **`VoiceCompanionWidget.tsx`**: Tactical floating HUD microphone with live audio visualizer bars, push-to-talk trigger, and status feedback.
- **`Tabs.tsx`**: Tactile sliding pill tabs with animated background indicators.

---

## 7. Accessibility & Ergonomics Standards

- **Color Contrast**: All text tokens achieve a minimum contrast ratio of `4.8:1` against their respective container surfaces, exceeding WCAG 2.1 AA criteria.
- **Keyboard Navigation**: Interactive elements feature clear, high-contrast focus rings (`outline: 2px solid var(--nexus-primary)`).
- **Screen Reader Support**: Live updating telemetry cards include `aria-live="polite"` attributes, broadcasting significant threshold violations without interrupting operator workflow.

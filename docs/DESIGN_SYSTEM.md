# NEXUS Design System — Warm Industrial & Spatial Minimalism

This document specifies the visual grammar, spatial layout rules, motion curves, and chromatic palettes implemented across the NEXUS platform.

---

## 1. Aesthetic Foundations

NEXUS implements **Spatial Minimalism** and **Warm Industrial** design:
- **Foundations**: Natural chalk white background (`#FCF9F7` / `hsl(30, 20%, 98%)`) instead of cold tech blues or stark monotone whites.
- **Obsidian Typography**: High-contrast, warm dark grey typography (`#20231F` / `hsl(80, 7%, 13%)`) ensuring readability for prolonged operations.
- **Telemetry Indicators**: Muted Sage / Emerald tones (`#1B4D3E`) for nominal telemetry and Amber/Coral tones for elevated attention.
- **Simulation Isolation**: Lavender / Amethyst Violet (`#9C27B0` / `hsl(291, 64%, 42%)`) strictly reserved for hypothetical "what-if" simulations and dashed border ghost states.

---

## 2. Color Palette & Token Hierarchy

| Token Name | Hex Code | HSL Representation | Semantic Operational Usage |
| :--- | :--- | :--- | :--- |
| `nexus-surface` | `#FCF9F7` | `hsl(30, 20%, 98%)` | Application background & main canvas |
| `nexus-surface-container` | `#F2ECE9` | `hsl(24, 22%, 93%)` | Table headers, secondary toolbars & card fills |
| `nexus-surface-container-high` | `#E8DFDC` | `hsl(18, 20%, 88%)` | Modal backgrounds, active drawer fills & border highlights |
| `nexus-on-surface` | `#20231F` | `hsl(80, 7%, 13%)` | Primary typography, headers & high-contrast labels |
| `nexus-on-surface-variant` | `#5C6058` | `hsl(86, 4%, 36%)` | Secondary subtitles, timestamps & inactive tabs |
| `nexus-primary` | `#1B4D3E` | `hsl(162, 48%, 21%)` | Primary action buttons & active navigation indicators |
| `nexus-secondary` | `#7D5260` | `hsl(339, 21%, 41%)` | Telemetry highlights & secondary button fills |
| `nexus-lavender` | `#E8DCF0` | `hsl(278, 43%, 90%)` | Simulation workspace backgrounds |
| `nexus-lavender-dark` | `#7B2CBF` | `hsl(272, 62%, 46%)` | Simulation badges, ghost route splines & what-if controls |
| `nexus-critical` | `#BA1A1A` | `hsl(0, 75%, 42%)` | Critical SLA breaches, blocked routes & urgent alerts |

---

## 3. Tactile Motion & Spring Physics

All user interactions employ physical spring models defined via `motion/react`:

### Key Motion Components (`frontend/components/motion/`):
1. **`FadeIn`**: Viewport-triggered spatial entrances with configurable direction and easing curves.
2. **`SpringCard`**: Tactile interactive cards with `whileTap={{ scale: 0.985 }}` and smooth hover elevation.
3. **`StaggerList` & `StaggerItem`**: Staggered container animations for lists, tables, and metric arrays.
4. **`NumberTransition`**: Real-time spring counter updating telemetry values without sudden jumps.
5. **`ScrollStory`**: Scroll-driven 7-stage interactive storytelling container.

---

## 4. 3D Procedural Companion Avatar (`Avatar3D`)

The avatar companion reacts deterministically to operational state:

```
Priority Hierarchy:
CRITICAL > ERROR > WARNING > SIMULATING > THINKING > SUCCESS > FOCUSED > WELCOME > EMPTY > OFFLINE > IDLE
```

- **Interactive Gaze**: Smooth lerp interpolation following the user's cursor position.
- **Tactile Glow Beacon**: Glowing mood ring indicating current subsystem health.
- **Bounce Physics**: Spring bounce animation on click interaction.

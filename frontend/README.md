# 🌐 NEXUS Next.js 15 App Router Frontend

Enterprise 3D Spatial GIS Command HUD built with Next.js 15, MapLibre GL, Tailwind CSS, and Framer Motion.

---

## 🏛️ Architecture Overview

- **`app/`**: 60+ compiled Next.js 15 App Router routes.
- **`components/`**: 3D vector GIS map (`map/`), UI primitives (`ui/`), command layouts (`layout/`), motion wrappers (`motion/`).
- **`lib/`**: Data provider (`data-provider.ts`), real-time SSE stream client (`realtime-client.ts`), state management stores.
- **`styles/`**: Global styles and CSS design tokens.

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Production build check
npm run build

# TypeScript type safety check
npx tsc --noEmit
```

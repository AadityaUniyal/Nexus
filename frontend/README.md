# NEXUS Frontend — Next.js 15 WebGL App

The NEXUS frontend is built on **Next.js 15 (App Router)**, React 18, MapLibre GL 3D vector graphics, Tailwind CSS, Motion, and Three.js / React Three Fiber.

---

## 🏛️ Architecture & Highlights

- **78 Production Routes**: Operational command center (`/overview`, `/live-world`, `/operations`, `/incidents`, `/simulations`, `/admin`, `/features/*`).
- **Resilient Data Provider (`lib/data-provider.ts`)**: Direct backend API connectivity with health-aware fallback handling for production stability.
- **Real-Time SSE Watchdog (`lib/realtime-client.ts`)**: Server-Sent Events client with auto-reconnection and connection health state management.
- **Procedural 3D Companion Avatar (`components/avatar/Avatar3D.tsx`)**: 4-channel continuous animation loop (breathing, hover float, eye tracking, status pulse) with interactive 360° click gestures.
- **Tactical Voice HUD (`components/voice/TacticalVoiceController.tsx`)**: Hands-free push-to-talk voice copilot with real-time audio waveform visualizer.
- **Vercel Compatibility (`vercel.json`)**: Pre-configured for Next.js App Router deployment on Vercel.

---

## 🚀 Quickstart & Building

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# TypeScript type checking
npx tsc --noEmit

# Production build compilation
npm run build
```

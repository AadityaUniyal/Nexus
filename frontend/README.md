# 🌐 NEXUS Next.js 15 App Router Frontend

Enterprise Autonomous Logistics Operating System, Real-Time Leaflet GIS World Map, and Apple-Grade Tactile Command Center.

---

## 🚀 Live Production Web App
- **Production URL**: [https://nexus-logistics-os.vercel.app](https://nexus-logistics-os.vercel.app)

---

## 🏛️ Architecture Overview

The frontend is an optimized **Next.js 15** application utilizing React Server Components and Leaflet GIS client islands:

- **`app/`**: 66 static and dynamic App Router routes covering:
  - **`(app)/overview/`**: Tactical nerve center mounting 5 custom role cockpits (Manager, Operator, Analyst, Administrator, Viewer).
  - **`operations/`**: High-density fleet management (Vehicles, Warehouses, Orders, Routes) with RFC 4180 CSV export and bulk ingestion.
  - **`status/`**: Public SLA monitoring and live cloud health dashboard.
  - **`admin/audit/`**: Cryptographic SHA-256 action audit ledger with modal forensic inspection.
  - **`driver-pass/` & `driver/`**: Zero-install mobile Driver PWA with live telemetry beaconing and QR Proof of Delivery.
- **`components/`**:
  - **`map/`**: Interactive Leaflet World Map with CartoDB basemap, real-time telemetry HUD badges, and hazard layers.
  - **`forms/`**: Create modals and `CsvImportModal` with schema mapping and preview validation.
  - **`ui/`**: Apple HIG design primitives, glassmorphism tiles, `command-palette.tsx` (Omnisearch), `SupportTicketModal.tsx`.
- **`lib/`**:
  - `csv-export.ts`: Universal RFC 4180 CSV export utility.
  - `sound-effects.ts`: Web Audio API procedural tactical audio synthesizer.
  - `permissions.ts` & `AuthProvider.tsx`: Fine-grained RBAC action guards.

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev
# Open http://localhost:3000

# Verify production build (66 pages)
npm run build

# TypeScript verification
npx tsc --noEmit
```


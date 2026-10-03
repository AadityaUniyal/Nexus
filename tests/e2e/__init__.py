"""
Nexus Logistics Platform - End-to-End Test Suite (tests/e2e)
4-Tier Opaque-Box Test Architecture:
- Tier 1: Feature Coverage (Health, Clerk Auth, Operations, Incidents, Simulations, Azure)
- Tier 2: Boundary & Corner Cases (Empty bodies, invalid tokens, boundary query params, rate limits)
- Tier 3: Cross-Feature Interactions (Auth -> Incident -> Simulation -> Telemetry -> Multi-tenant)
- Tier 4: Real-World Scenarios (Full Emergency Reroute Workflow, Webhook Telematics, Bulk Ingestion)
"""

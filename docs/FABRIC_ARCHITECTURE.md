# Microsoft Fabric Real-Time & Analytical Architecture

## 1. Executive Summary & Architectural Vision

NEXUS integrates seamlessly with **Microsoft Fabric** to provide enterprise-grade real-time streaming analytics, historical corridor optimization, and zero-copy Direct Lake Power BI reporting across all logistics operations. 

By unifying operational telemetry from Azure IoT Hub, Samsara, Geotab, and onboard sensors into **OneLake**, NEXUS achieves sub-second anomaly detection while providing dispatchers and supply chain executives with instantaneous access to petabyte-scale historical performance data.

```
                    ┌─────────────────────────┐
                    │  NEXUS Ingestion Engine │
                    │ (IoT Hub, SSE, Webhooks)│
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │ Fabric Eventstream│           │  OneLake Storage  │
       │ (Real-Time Hub)   │           │ (ADLS Gen2 Store) │
       └─────────┬─────────┘           └─────────┬─────────┘
                 │                               │
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │ Fabric Eventhouse │           │ Medallion Tables  │
       │ (KQL DB - Fast)   │           │ (Bronze→Silver→   │
       └─────────┬─────────┘           │      Gold Delta)  │
                 │                     └─────────┬─────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ Power BI Direct Lake  │
                     │  (Zero-ETL Dashboards)│
                     └───────────────────────┘
```

---

## 2. Medallion Architecture in OneLake Delta Lake

All operational data committed from NEXUS SaaS tenants is organized in a strict Medallion Architecture (`Bronze` -> `Silver` -> `Gold`) inside the tenant workspace Lakehouse (`nexus_lakehouse`):

### 2.1 Bronze Layer (Raw Ingestion)
- **Path**: `Files/bronze/{tenant_id}/{source}/{yyyy}/{mm}/{dd}/`
- **Format**: Raw compressed JSON / Avro payloads verbatim from IoT Hub and provider webhooks (Samsara, Geotab).
- **Retention**: 90-day cold storage life-cycle rule.
- **Payload Schema**:
  ```json
  {
    "ingestion_id": "ing-uuid4",
    "received_at": "2026-09-15T15:30:00.123Z",
    "source": "SAMSARA",
    "organization_id": "org-nexus-demo",
    "workspace_id": "ws-continental-fleet-01",
    "raw_body": { ... }
  }
  ```

### 2.2 Silver Layer (Cleaned, Enriched & Conformed)
- **Delta Table**: `Tables/silver_telemetry_events`
  - **Partitioning**: `organization_id`, `date`
  - **Columns**: `event_id` (string), `vehicle_id` (string), `vin` (string), `timestamp` (timestamp), `latitude` (double), `longitude` (double), `speed_kph` (float), `heading` (float), `fuel_pct` (float), `battery_pct` (float), `engine_temp_c` (float), `status` (string), `odometer_km` (float).
- **Delta Table**: `Tables/silver_trips`
  - **Columns**: `trip_id`, `organization_id`, `workspace_id`, `vehicle_id`, `driver_id`, `start_time`, `end_time`, `origin_warehouse_id`, `destination_warehouse_id`, `total_distance_km`, `avg_speed_kph`, `fuel_consumed_liters`, `co2_emissions_kg`.
- **Delta Table**: `Tables/silver_incidents`
  - **Columns**: `incident_id`, `organization_id`, `workspace_id`, `type`, `severity`, `status`, `lat`, `lng`, `reported_at`, `resolved_at`, `impact_score`.

### 2.3 Gold Layer (Curated Business & Operational Marts)
- **Delta Table**: `Tables/gold_fleet_kpis`
  - **Aggregation**: Daily rollup per organization and fleet corridor.
  - **Metrics**: On-time delivery rate (OTD %), idle time percentage, fuel economy (km/L), fleet utilization rate, MTTR (mean time to incident resolution).
- **Delta Table**: `Tables/gold_driver_safety_scores`
  - **Metrics**: Harsh braking events per 100km, speeding duration index, Hours-of-Service (HOS) compliance rate, driver safety grade (A/B/C/D/F).
- **Delta Table**: `Tables/gold_route_efficiency`
  - **Metrics**: Historical delay variance, weather correlation coefficient, alternative corridor cost index.

---

## 3. Fabric Real-Time Hub & Eventhouse (KQL)

High-throughput vehicle telematics (up to 50,000 events/sec across enterprise tenants) are routed directly through **Microsoft Fabric Eventstreams** to an **Eventhouse KQL Database** (`nexus_realtime`):

### 3.1 KQL Real-Time Table Schema
```kql
.create table VehicleTelemetryStream (
    EventId: string,
    OrganizationId: string,
    WorkspaceId: string,
    VehicleId: string,
    Timestamp: datetime,
    Latitude: real,
    Longitude: real,
    SpeedKph: real,
    Heading: real,
    FuelPct: real,
    BatteryPct: real,
    EngineTempC: real,
    OdometerKm: real,
    AlertFlags: dynamic
)
```

### 3.2 Real-Time Anomaly & Geofence Queries
```kql
// Sub-second speed violation and harsh braking detection
VehicleTelemetryStream
| where Timestamp > ago(5m)
| where SpeedKph > 110.0 or EngineTempC > 105.0
| project Timestamp, OrganizationId, WorkspaceId, VehicleId, SpeedKph, EngineTempC, Latitude, Longitude
| summarize AnomalyCount = count() by VehicleId, bin(Timestamp, 1m)
| where AnomalyCount >= 3
```

---

## 4. Direct Lake Power BI Semantic Model

NEXUS provides native Power BI integration using **Direct Lake mode**. Unlike DirectQuery (which translates queries to SQL on the fly) or Import mode (which caches data on a schedule), Direct Lake reads native Delta Parquet files directly from OneLake into the Power BI Analysis Services engine in-memory.

### Key Performance Benefits
1. **Zero-Latency Ingestion**: Changes written by `fabric_onelake.py` micro-batches are immediately queryable in Power BI dashboards within seconds.
2. **Zero-ETL Overhead**: No data duplication, no data gateway setup required.
3. **Enterprise Security & RLS**: Dynamic Row-Level Security automatically filters datasets by `workspace_id == USERPRINCIPALNAME()` or organization domain claims.

---

## 5. Security, Multi-Tenancy & Compliance

1. **Workspace Boundary**: Multi-tenant isolation is guaranteed by partitioning OneLake tables by `organization_id` and `workspace_id`.
2. **Microsoft Entra ID RBAC**: Fast access tokens issued by Entra ID ensure that dispatchers, analysts, and enterprise admins only access lakehouse items provisioned for their tenant.
3. **Auditability**: All analytical data access is logged in Microsoft Purview and the NEXUS Governance audit ledger.

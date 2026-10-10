# NEXUS Prediction Accuracy & Analytics Engine

NEXUS does not claim artificial intelligence or unverified machine learning magic. All risk classifications and ETA projections are deterministic models combining real driver GPS streams with Azure Maps Gen2 live traffic telemetry.

This document outlines the statistical validation methodology, evaluation thresholds, and Parquet data export schema.

---

## 1. Core Principles

1. **Zero Mock Accuracy**: The analytics dashboard returns honest empty and null states until a statistically sufficient sample size ($N \ge 5$) of completed delivery jobs is recorded in the workspace.
2. **Deterministic Classification**:
   - `on_time`: $\text{ETA} + \text{Margin} \le \text{Window End}$
   - `at_risk`: $\text{ETA} - \text{Margin} \le \text{Window End} < \text{ETA} + \text{Margin}$
   - `late`: $\text{ETA} - \text{Margin} > \text{Window End}$
   - `unknown`: No driver GPS ping within 300 seconds, or provider rate limit reached.
3. **Uncertainty Margin**: Computed dynamically as $\max(300\text{s}, 0.15 \times \text{Travel Time Seconds})$.

---

## 2. Statistical Metrics Definition

All metrics are evaluated against real recorded actual arrivals (`actual_arrival_at`):

### 1. On-Time Delivery Rate
$$\text{On-Time Rate} = \frac{\sum [\text{actual\_arrival\_at} \le \text{window\_end}]}{N_{\text{completed\_stops}}}$$

### 2. Median Absolute Error (MAE) by Lead Time
Evaluated at specific lead horizons prior to arrival ($T_{\text{lead}} \in \{15\text{m}, 30\text{m}, 60\text{m}\}$ with $\pm 10\text{m}$ tolerance window):
$$\text{MAE}(T_{\text{lead}}) = \text{median}\left( |\text{predicted\_eta} - \text{actual\_arrival\_at}| \right)$$

### 3. Systematic Prediction Bias at 30 Minutes
$$\text{Bias}_{30\text{m}} = \text{mean}\left( \text{predicted\_eta} - \text{actual\_arrival\_at} \right)$$
- Positive value: Model systematically predicts later than actual arrival (conservative).
- Negative value: Model systematically underestimates traffic delays (optimistic).

### 4. Late Flag Precision & Recall at 30 Minutes
- **True Positive ($TP$)**: Predicted `at_risk` or `late` at $T-30\text{m}$, and arrival was actually late.
- **False Positive ($FP$)**: Predicted `at_risk` or `late` at $T-30\text{m}$, but arrival was on-time.
- **False Negative ($FN$)**: Predicted `on_time` at $T-30\text{m}$, but arrival was actually late.

$$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}$$

---

## 3. Parquet Lakehouse Telemetry Schema

Daily partition exports write to Azure Blob Storage under `telemetry/year=YYYY/month=MM/day=DD/`.

### Table: `location_pings.parquet`
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36)` | Unique ping UUID |
| `workspace_id` | `VARCHAR(64)` | Tenant isolation key |
| `driver_id` | `VARCHAR(36)` | Assigned driver UUID |
| `client_ping_id` | `VARCHAR(64)` | Client idempotency key |
| `lat` | `DOUBLE` | WGS84 Latitude |
| `lon` | `DOUBLE` | WGS84 Longitude |
| `heading` | `DOUBLE` | Heading in degrees (0-360) |
| `speed_mps` | `DOUBLE` | Ground speed in meters per second |
| `accuracy_m` | `DOUBLE` | GPS horizontal accuracy radius |
| `recorded_at` | `TIMESTAMP_NTZ` | Timestamp recorded on driver device |
| `created_at` | `TIMESTAMP_NTZ` | Ingest timestamp on backend |

### Table: `predictions.parquet`
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36)` | Unique prediction UUID |
| `workspace_id` | `VARCHAR(64)` | Tenant isolation key |
| `job_id` | `VARCHAR(36)` | Target delivery job |
| `stop_id` | `VARCHAR(36)` | Target stop sequence |
| `driver_id` | `VARCHAR(36)` | Driver executing the job |
| `origin_lat` | `DOUBLE` | Driver origin latitude |
| `origin_lon` | `DOUBLE` | Driver origin longitude |
| `eta_at` | `TIMESTAMP_NTZ` | Projected arrival timestamp (UTC) |
| `travel_time_seconds` | `INTEGER` | Route duration including traffic |
| `traffic_delay_seconds`| `INTEGER` | Congestion delay vs free-flow |
| `uncertainty_margin_seconds`| `INTEGER` | Confidence window buffer |
| `status` | `VARCHAR(20)` | `on_time`, `at_risk`, `late`, `unknown` |
| `reason` | `TEXT` | Plain language explanation |
| `cache_hit` | `BOOLEAN` | Whether route was cached |
| `created_at` | `TIMESTAMP_NTZ` | Prediction timestamp |

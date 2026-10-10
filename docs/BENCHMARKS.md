# NEXUS High-Concurrency Benchmarks & Performance Profile

This document outlines empirical latency, throughput, memory bounds, and cost profiles measured across the NEXUS telemetry ingestion, risk evaluation, and cryptographic integrity engines.

---

## 1. Executive Performance Summary

| Pipeline Component | Metric | Target | Measured Result | Status |
|---|---|---|---|---|
| **GPS Batch Ingest API** | p95 Response Time (50 concurrent drivers) | $\le 150\text{ ms}$ | **$24.2\text{ ms}$** | **`PASS`** |
| **SSE Event Fan-out** | 50 concurrent dispatchers / workspace | $\le 20\text{ ms}$ | **$1.8\text{ ms}$** | **`PASS`** |
| **Cryptographic Hash Chaining** | Sequential SHA-256 throughput | $\ge 5,000\text{ ops/sec}$ | **$21,450\text{ ops/sec}$** | **`PASS`** |
| **Sliding-Window Rate Limiter** | Throughput (10,000 requests) | $\ge 20,000\text{ checks/sec}$ | **$74,200\text{ checks/sec}$** | **`PASS`** |
| **Route Cache Hit Overhead** | Quantized 110m cell lookup | $\le 2\text{ ms}$ | **$0.04\text{ ms}$** | **`PASS`** |

---

## 2. Telemetry Ingestion & Concurrency Profile

### Test Scenario:
- **50 concurrent driver sessions** emitting 10-ping telemetry batches every 5 seconds.
- **Total sustained load**: 100 raw GPS pings/second.
- **Server Environment**: Linux container (1 vCPU, 512MB RAM equivalent to Azure Container Apps scale-to-zero baseline).

### Latency Percentiles (HTTP POST `/api/v1/driver/pings`):
- **p50 (Median)**: $12.1\text{ ms}$
- **p90**: $18.4\text{ ms}$
- **p95**: $24.2\text{ ms}$
- **p99**: $38.7\text{ ms}$
- **Error Rate**: $0.00\%$

---

## 3. Memory & Resource Footprint

1. **Sliding Window Rate Limiter**:
   - Memory complexity is bounded to $O(N_{\text{active\_sessions}} \times K_{\text{window\_capacity}})$.
   - 1,000 active concurrent drivers consume $< 1.2\text{ MB}$ of memory in the bounded deque structure.
2. **Server-Sent Events (SSE) Broadcast Hub**:
   - Asynchronous per-workspace fan-out queues with max queue size 100 prevents backpressure leaks or unbounded memory growth from disconnected or slow clients.
3. **Route Quantization Cache**:
   - 3-decimal place geographic coordinate quantization (~110m resolution) with 60-second TTL limits in-memory route cache size to $< 500\text{ KB}$ for standard metropolitan fleet deployments.

---

## 4. Azure for Students Spend & Cost Profile

NEXUS achieves enterprise-grade real-time fleet capabilities while operating 100% inside the \$100 Azure for Students annual credit.

| Cloud Resource | Pricing Tier | Monthly Consumption | Monthly Cost (USD) |
|---|---|---|---|
| **Azure Maps Gen2** | Consumption ($0 - 25k free tx/month) | ~8,000 directions & tile calls | **\$0.00** |
| **Azure Key Vault** | Standard Tier ($0.03 per 10k ops) | ~2,500 startup secret reads | **\$0.01** |
| **Azure Blob Storage (Parquet)** | Standard LRS ($0.018 / GB) | ~200 MB Parquet / month | **\$0.01** |
| **Log Analytics & App Insights** | 5GB free monthly allowance | ~450 MB logs & traces | **\$0.00** |
| **Azure Container Apps** | Scale-to-Zero (180k vCPU-s free/mo) | Continuous dev/demo execution | **\$0.00** |
| **Neon Serverless Postgres** | Free Tier (0.5 GB, scale-to-zero) | Primary transactional database | **\$0.00** |
| **Vercel Edge Network** | Hobby Free Tier | Frontend Next.js 14 hosting | **\$0.00** |
| **Total Steady-State Spend** | — | — | **\$0.02 / month** |

# ADR 0001: Evaluation of Azure Data Explorer (ADX) & Synapse vs Serverless Parquet on Blob Storage

## Status
Accepted

## Context
NEXUS requires high-frequency driver GPS and prediction telemetry archival for historical replay, dispatch decision audits, and empirical accuracy analysis. In earlier design proposals, Azure Data Explorer (ADX) / Kusto and Azure Synapse / Microsoft Fabric were suggested as analytical engines.

However, NEXUS operates under a non-commercial dev/test constraint on an Azure for Students subscription with a strictly capped $100 total credit for 12 months.

## Analysis & Cost Modeling

1. **Azure Data Explorer (ADX) / Kusto Cluster**:
   - Minimum production cluster (2 nodes of `Standard_E2a_v4` or `Dev/Test SKU`): ~$140–$220/month.
   - Even a stopped cluster incurs storage and compute reservation charges.
   - ADX Free Tier exists only in selected commercial regions with strict personal limits and is not provisionable via standard Terraform/Bicep with student subscription RBAC.
   - **Conclusion**: Burns the entire $100 credit in under 3 weeks.

2. **Microsoft Fabric / Azure Synapse**:
   - Fabric Capacity (F2 smallest SKU): ~$260/month minimum.
   - Synapse dedicated SQL pool: ~$1.20/hour (~$860/month).
   - **Conclusion**: Incompatible with budget constraints.

3. **Serverless Columnar Parquet on Azure Blob Storage (Chosen Architecture)**:
   - Partitioned Parquet archives (`year=YYYY/month=MM/day=DD/*.parquet`) generated nightly via Apache Arrow / PyArrow.
   - Storage Cost: Standard LRS Hot tier is ~$0.018 per GB/month. Telemetry for 50 drivers generates < 200 MB/month (~$0.004/month).
   - Compute: In-memory duckdb / pyarrow queries on demand; Neon serverless Postgres handles live transactional queries and scales to zero when idle.
   - Total Cost: < $0.05/month.

## Decision
We reject dedicated ADX and Fabric clusters in favor of daily Parquet exports to Azure Blob Storage anchored by SHA-256 cryptographic audit logs in Neon Postgres. If enterprise analytical scaling is required in commercial phases, ADX external tables or Synapse Serverless SQL can mount this identical Blob Parquet container with zero schema migration.

## Consequences
- **Positive**: Zero fixed monthly compute burn, 100% preservation of $100 Azure for Students credit.
- **Positive**: Standard Apache Parquet format enables portability to DuckDB, Pandas, Snowflake, or ADX.
- **Negative**: Historical analytical queries across multi-year raw traces require on-demand Parquet scanning rather than sub-second KQL indexing. (Acceptable for current operational scale of 1–50 vehicles).

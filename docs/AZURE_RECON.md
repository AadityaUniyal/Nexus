# Azure Subscription & Infrastructure Reconnaissance Report

- **Date:** October 10, 2026
- **Subscription Type:** Azure for Students ($100 credit for 12 months, dev/test/demo non-commercial)
- **Subscription ID:** `5d4d8b69-8275-474f-84ed-cc922cba5ecc`
- **Tenant ID:** `1490b17d-5dc9-4cbf-aeba-a2e854f521b8`
- **Signed-in Account:** `240211539@geu.ac.in` (Role: `Owner`)

---

## 1. Policy & Region Restrictions

Policy check on subscription scope identified an active policy assignment:
- **Policy Name:** `sys.regionrestriction`
- **Policy Definition ID:** `/providers/Microsoft.Authorization/policyDefinitions/b86dabb9-b578-4d7b-b842-3b45e95769a1`
- **Display Name:** Allowed resource deployment regions
- **Enforcement Mode:** Default (`deny` on non-compliant resource creations)

### Allowed Deployment Regions:
1. `austriaeast`
2. `southeastasia`
3. `eastasia`
4. `koreacentral`
5. `malaysiawest`

> **Note on `global` resources:**
> The policy evaluation rule explicitly excludes resources with `location == "global"` (`allOf: [location notIn listOfAllowedLocations, location notEquals 'global']`). Global resources and services supporting `global` location are permitted.
> Regional resources must target one of the 5 allowed locations (e.g. `austriaeast` or `southeastasia`).

---

## 2. Resource Provider Registration Status

| Resource Provider | Registration State | Action Required |
|---|---|---|
| `Microsoft.KeyVault` | `Registered` | Ready |
| `Microsoft.Storage` | `Registered` | Ready |
| `Microsoft.OperationalInsights` | `Registered` | Ready |
| `Microsoft.Insights` | `Registered` | Ready |
| `Microsoft.Consumption` | `Registered` | Ready (Budgets) |
| `Microsoft.ManagedIdentity` | `Registered` | Ready |
| `Microsoft.Maps` | `NotRegistered` | Must be registered before deploying Azure Maps |
| `Microsoft.App` | `NotRegistered` | Must be registered before deploying Container Apps |

---

## 3. Existing Resources & Cost Audit

Discovery via `az resource list` found legacy prototype resources currently deployed:

### Resource Group: `nexus-api-prod_group` (Location: `centralindia`, resources in `austriaeast`)
- `nexus-pg-prod` (`Microsoft.DBforPostgreSQL/flexibleServers`, SKU: `Standard_B1ms`, Status: `Ready`)
  - **CRITICAL COST RISK:** Azure Flexible Server running continuously consumes approximately $15–$25/month of the $100 student credit.
- `nexus-redis-prod` (`Microsoft.Cache/redisEnterprise`, SKU: `Balanced_B0`, Status: `Running`)
  - **CRITICAL COST RISK:** Redis Enterprise Balanced tier consumes significant credit (up to $15–$20/month).
- `nexus-iothub-prod24` (`Microsoft.Devices/IotHubs`)
- `nexus-api-prod` (`Microsoft.Web/sites`, App Service)
- `ASP-nexusapiprodgroup-8fa2` (`Microsoft.Web/serverFarms`)
- `nexus-kv-prod24` (`Microsoft.KeyVault/vaults`)
- `nexus-logs-prod` (`Microsoft.OperationalInsights/workspaces`)
- `nexus-ai-prod` (`Microsoft.Insights/components`)
- `oidc-msi-8a8b` (`Microsoft.ManagedIdentity/userAssignedIdentities`)

### Resource Group: `DefaultResourceGroup-CAU`
- `nexusstorprod` (`Microsoft.Storage/storageAccounts`)

### Legacy Resource Teardown Recommendation:
The NEXUS rebuild architecture replaces self-hosted/Azure Postgres with **Neon Postgres** (free tier, scale-to-zero) and eliminates Redis entirely (in-memory single replica SSE in this phase). Keeping `nexus-pg-prod` and `nexus-redis-prod` active risks burning the remaining student credit rapidly. They should be stopped or deprovisioned as part of Checkpoint 1 cleanup.

---

## 4. Quotas and Existing Budgets

- Existing budgets: None (`az consumption budget list` returned `[]`).
- Planned budgets in Bicep:
  - Budget alert threshold 1: $50 (50% of $100 credit)
  - Budget alert threshold 2: $80 (80% of $100 credit)
  - Notification target: Parameterized contact email (e.g. `240211539@geu.ac.in`).

---

## 5. Security & Entra ID Findings

- User `240211539@geu.ac.in` is an Entra user with `Owner` privileges on the Azure subscription.
- No client secrets or tenant passwords are hardcoded in source.
- User-Assigned Managed Identity (`Microsoft.ManagedIdentity/userAssignedIdentities`) will be used to grant the API permission to query Azure Maps without embedding account keys or secrets.

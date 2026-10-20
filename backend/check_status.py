import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import settings
from app.db.session import engine
from sqlalchemy import text
from app.main import health_live, health_ready, azure_health

async def main():
    print("=" * 60)
    print("  NEXUS — Comprehensive System & Azure Health Check")
    print("=" * 60)

    # 1. Config Check
    print(f"\n[1] Configuration:")
    print(f"  Project:         {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"  Subscription ID: {settings.AZURE_SUBSCRIPTION_ID}")
    print(f"  Resource Group:  {settings.AZURE_RESOURCE_GROUP}")
    print(f"  Location:        {settings.AZURE_LOCATION}")
    print(f"  Web App:         {settings.AZURE_WEBAPP_URL}")
    print(f"  Storage:         {bool(settings.AZURE_STORAGE_CONNECTION_STRING)}")
    print(f"  App Insights:    {bool(settings.APPLICATIONINSIGHTS_CONNECTION_STRING)}")
    print(f"  Key Vault:       {settings.AZURE_KEYVAULT_URL}")

    # 2. Database Check
    print(f"\n[2] PostgreSQL Database:")
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT current_database(), current_user, count(*) FROM information_schema.tables WHERE table_schema = 'public'"))
            row = res.fetchone()
            print(f"  Database:        {row[0]}")
            print(f"  User:            {row[1]}")
            print(f"  Tables Count:    {row[2]}")
            print(f"  Status:          CONNECTED (SSL Active via asyncpg)")
    except Exception as e:
        print(f"  Status:          FAILED ({e})")

    # 3. Azure Health Check
    print(f"\n[3] Azure Free Tier Integrations:")
    FREE_TIER_LIMITS = {
        "applicationInsights": "5 GB/month free ingestion",
        "blobStorage": "5 GB LRS storage, 20k get/put",
        "iotHub": "F1 Free: 8,000 msgs/day",
        "fabric": "Capacity free trial",
    }
    az_res = await azure_health()
    for svc, details in az_res.get("services", {}).items():
        if isinstance(details, dict):
            st = details.get("status", "UNKNOWN")
            limit = details.get("freeTierLimit", FREE_TIER_LIMITS.get(svc, ""))
        else:
            st = str(details)
            limit = FREE_TIER_LIMITS.get(svc, "")
        limit_str = f" ({limit})" if limit else ""
        print(f"  • {svc:20}: {st:15}{limit_str}")
    
    overall = az_res.get("status")
    print(f"\nOverall Azure Platform Status: {overall}")

    # 4. External Service Circuit Breakers
    print(f"\n[4] External Service Circuit Breakers:")
    from app.core.resilience import geo_circuit, weather_circuit, ai_circuit
    for cb in [geo_circuit, weather_circuit, ai_circuit]:
        cb_stat = cb.get_status()
        print(f"  • {cb.name:20}: {cb_stat['state']:10} (failures: {cb_stat['failure_count']}, calls: {cb_stat['total_calls']})")

    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

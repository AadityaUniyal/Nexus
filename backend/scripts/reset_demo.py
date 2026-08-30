import asyncio
from sqlalchemy import text
from app.db.session import async_session_factory
from scripts.seed_demo import seed_database

async def reset_demo():
    print("[*] Resetting demo database to canonical baseline state...")
    async with async_session_factory() as session:
        # Re-seed canonical state
        pass
    await seed_database()
    print("[+] Reset complete.")

if __name__ == "__main__":
    asyncio.run(reset_demo())

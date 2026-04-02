import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def alter_enum():
    engine = create_async_engine(settings.DATABASE_URL)
    try:
        async with engine.begin() as conn:
            # We add IF NOT EXISTS equivalent for ENUM by catching Exception if it exists, or Postgres 12+ supports IF NOT EXISTS
            try:
                await conn.execute(text("ALTER TYPE complaint_role ADD VALUE IF NOT EXISTS 'admin';"))
            except Exception as e:
                print(f"Enum value 'admin' already exists or other error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(alter_enum())

import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
import uuid

async def seed():
    async with AsyncSessionLocal() as db:
        admin = User(
            id=str(uuid.uuid4()),
            first_name="Admin",
            last_name="User",
            email="admin@waste2wealth.com",
            phone="+254700000000",
            hashed_password=hash_password("AdminPass123!"),
            role="admin",
            is_verified=True,
        )
        db.add(admin)
        await db.commit()
        print("Admin seeded.")

asyncio.run(seed())
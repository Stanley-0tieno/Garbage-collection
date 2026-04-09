import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
import uuid

from app.db.session import engine

async def seed():
    try:
        print("Acquiring session...")
        async with AsyncSessionLocal() as db:
            admin = User(
                id=str(uuid.uuid4()),
                first_name="Admin",
                last_name="User",
                email="175dollarsnow@gmail.com",
                phone="+254700000000",
                password_hash=hash_password("StrongPassword123!"),
                role="admin",
                is_verified=True,
                points=0,
                is_active=True
            )
            db.add(admin)
            await db.commit()
            print("Admin seeded.")
    except Exception as e:
        print("Error seeding:", e)
    finally:
        await engine.dispose()
        print("Engine disposed.")

asyncio.run(seed())
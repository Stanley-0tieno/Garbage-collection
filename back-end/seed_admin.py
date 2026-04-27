import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password

async def seed_admin():
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        admin = await session.execute(
            select(User.id).where(User.role == 'admin').limit(1)
        )
        if not admin.scalar_one_or_none():
            admin_user = User(
                first_name="Admin",
                last_name="User",
                email="admin@waste2wealth.com",
                phone="0700000000",
                role="admin",
                password_hash=hash_password("admin123"),
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            print("Admin user recreated! Credentials: admin@waste2wealth.com / admin123")
        else:
            print("Admin already exists!")

if __name__ == "__main__":
    asyncio.run(seed_admin())

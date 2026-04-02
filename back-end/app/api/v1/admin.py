from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.pickup import Pickup
from app.schemas.admin import UserStatsOut

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=list[UserStatsOut])
async def get_users_stats(user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    users = await db.execute(select(User))
    users_list = users.scalars().all()
    
    stats_list = []
    for u in users_list:
        if u.role == "household":
            total = (await db.execute(select(func.count(Pickup.id)).where(Pickup.user_id == u.id))).scalar() or 0
            completed = (await db.execute(select(func.count(Pickup.id)).where(Pickup.user_id == u.id, Pickup.status == "COMPLETED"))).scalar() or 0
            spent = (await db.execute(select(func.sum(Pickup.amount)).where(Pickup.user_id == u.id, Pickup.payment_status == "PAID"))).scalar() or 0.0
            
            stats_list.append(UserStatsOut(
                id=u.id, first_name=u.first_name, last_name=u.last_name, email=u.email, role=u.role,
                total_pickups=total, completed_pickups=completed, total_spent=spent, total_earned=0.0
            ))
            
        elif u.role == "collector":
            total = (await db.execute(select(func.count(Pickup.id)).where(Pickup.collector_id == u.id))).scalar() or 0
            completed = (await db.execute(select(func.count(Pickup.id)).where(Pickup.collector_id == u.id, Pickup.status == "COMPLETED"))).scalar() or 0
            earned = (await db.execute(select(func.sum(Pickup.amount)).where(Pickup.collector_id == u.id, Pickup.status == "COMPLETED"))).scalar() or 0.0
            
            stats_list.append(UserStatsOut(
                id=u.id, first_name=u.first_name, last_name=u.last_name, email=u.email, role=u.role,
                total_pickups=total, completed_pickups=completed, total_spent=0.0, total_earned=earned
            ))
        else:
             stats_list.append(UserStatsOut(
                id=u.id, first_name=u.first_name, last_name=u.last_name, email=u.email, role=u.role,
                total_pickups=0, completed_pickups=0, total_spent=0.0, total_earned=0.0
            ))
            
    return stats_list

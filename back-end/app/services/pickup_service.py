from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from sqlalchemy import select

from app.models.pickup import Pickup
from app.models.user import User
from app.models.notification import Notification
from app.schemas.pickup import CreatePickupRequest

async def create_pickup(payload: CreatePickupRequest, user_id: str, db: AsyncSession):
    pickup = Pickup(
        user_id=user_id,
        waste_type=payload.waste_type,
        date=payload.date,
        address=payload.address,
        notes=payload.notes,
        image_url=payload.image_url,
        weight_estimate=payload.weight_estimate,
        status="PENDING",
        payment_status="UNPAID",
    )
    db.add(pickup)
    await db.commit()
    await db.refresh(pickup)
    
    # Notify all collectors
    collectors = await db.execute(select(User).where(User.role == "collector"))
    for collector in collectors.scalars().all():
        notif = Notification(
            user_id=collector.id,
            type="new_request",
            title="New Pickup Request",
            message=f"A new pickup request is available.",
            pickup_id=pickup.id
        )
        db.add(notif)
    await db.commit()
    
    return pickup

async def get_user_pickups(user_id: str, db: AsyncSession):
    result = await db.execute(select(Pickup).where(Pickup.user_id == user_id))
    return result.scalars().all()

async def get_all_pickups(db: AsyncSession):
    result = await db.execute(select(Pickup))
    return result.scalars().all()

async def update_pickup_status(pickup_id: str, new_status: str, collector_id: str, db: AsyncSession):
    pickup = await db.get(Pickup, pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
        
    pickup.status = new_status
    if new_status == "ASSIGNED":
        pickup.collector_id = collector_id
        notif = Notification(user_id=pickup.user_id, type="pickup_assigned", title="Pickup Assigned", message="A collector has been assigned to your pickup.", pickup_id=pickup.id)
        db.add(notif)
    elif new_status == "COMPLETED":
        # Add 50 points to household user
        user = await db.get(User, pickup.user_id)
        if user:
            user.points += 50
        pickup.points_earned = 50
        pickup.completed_at = datetime.now(timezone.utc)
        notif = Notification(user_id=pickup.user_id, type="pickup_completed", title="Pickup Completed", message="Your pickup was marked as completed. You earned 50 points!", pickup_id=pickup.id)
        db.add(notif)
    
    await db.commit()
    await db.refresh(pickup)
    return pickup

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.pickup import Pickup
from app.models.user import User
from app.models.notification import Notification
from app.schemas.pickup import CreatePickupRequest, UpdatePickupStatusRequest, WASTE_PRICES_PER_KG


# ── Helpers ────────────────────────────────────────────────────────────────

def _extract_area(address: str) -> str:
    """Extract first comma-separated segment as the area/zone."""
    return address.split(",")[0].strip() if address else ""


def _calc_amount(waste_type: str, weight_kg: float) -> float:
    """Calculate payment using predefined system price per kg."""
    # waste_type may be comma-joined if multi-type; use first for pricing
    primary = waste_type.split(",")[0].strip().lower()
    rate = WASTE_PRICES_PER_KG.get(primary, 5.0)
    return round(rate * weight_kg, 2)

async def create_pickup(
    payload: CreatePickupRequest,
    user_id: str,
    db: AsyncSession,
) -> Pickup:
    # Flatten multi-select waste types to comma-joined string
    waste_type_str = ",".join(payload.waste_type) if payload.waste_type else "general"

    # Auto-extract area from address if not explicitly provided
    area = payload.area or _extract_area(payload.address)

    pickup = Pickup(
        user_id=user_id,
        waste_type=waste_type_str,
        # date intentionally NOT set here — collector assigns it later
        area=area,
        address=payload.address,
        notes=payload.notes,
        image_url=payload.image_url,
        status="PENDING",
        payment_status="UNPAID",
    )
    db.add(pickup)
    await db.commit()
    await db.refresh(pickup)
    return pickup


async def get_user_pickups(user_id: str, db: AsyncSession) -> list[Pickup]:
    result = await db.execute(
        select(Pickup)
        .where(Pickup.user_id == user_id)
        .order_by(Pickup.created_at.desc())
    )
    return result.scalars().all()


async def get_all_pickups(db: AsyncSession) -> list[Pickup]:
    result = await db.execute(
        select(Pickup).order_by(Pickup.created_at.desc())
    )
    return result.scalars().all()


async def update_pickup_status(
    pickup_id: str,
    new_status: str,
    actor_id: str,
    db: AsyncSession,
    amount: float | None = None,
    weight_kg: float | None = None,
) -> Pickup:
    pickup = await db.get(Pickup, pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found.")

    # Fetch actor to get their name for collector_name
    actor = await db.get(User, actor_id)

    pickup.status = new_status

    if new_status == "ASSIGNED":
        pickup.collector_id = actor_id
        if actor:
            pickup.collector_name = f"{actor.first_name} {actor.last_name}"

        # Notify household that a collector accepted
        notif = Notification(
            user_id=pickup.user_id,
            type="pickup_assigned",
            title="Collector assigned to your pickup",
            message=f"{pickup.collector_name} has accepted your pickup request.",
            link_url="/household/pickup-history",
            pickup_id=pickup.id,
        )
        db.add(notif)

    elif new_status == "COMPLETED":
        pickup.completed_at = datetime.now(timezone.utc)

        # Calculate amount from weight using predefined price if weight provided
        if weight_kg and weight_kg > 0:
            pickup.weight_kg = weight_kg
            pickup.amount = _calc_amount(pickup.waste_type, weight_kg)
        elif amount:
            # Fallback: amount passed directly (e.g. from old flow)
            pickup.amount = amount

        # Notify household that pickup is weighed and needs payment
        notif = Notification(
            user_id=pickup.user_id,
            type="pickup_completed",
            title="Pickup weighed - Payment required",
            message=f"Your {pickup.waste_type} pickup was weighed. Amount due: KES {pickup.amount}. Please complete payment.",
            link_url="/household/pickup-history",
            pickup_id=pickup.id,
        )
        db.add(notif)

    elif new_status == "CANCELLED":
        pass  # no extra logic needed

    await db.commit()
    await db.refresh(pickup)
    return pickup


async def assign_pickup_date(
    pickup_id: str,
    date: datetime,
    collector_id: str,
    db: AsyncSession,
) -> Pickup:
    """Allow a collector to assign/update the pickup date."""
    pickup = await db.get(Pickup, pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found.")
    if pickup.collector_id and pickup.collector_id != collector_id:
        raise HTTPException(status_code=403, detail="Not your pickup.")

    pickup.date = date
    await db.commit()
    await db.refresh(pickup)

    # Notify household of confirmed date
    notif = Notification(
        user_id=pickup.user_id,
        type="pickup_assigned",
        title="Pickup date confirmed",
        message=f"Your pickup has been scheduled for {date.strftime('%A, %B %-d')}.",
        link_url="/household/pickup-history",
        pickup_id=pickup.id,
    )
    db.add(notif)
    await db.commit()

    return pickup


async def process_cash_payment(
    pickup_id: str,
    user_id: str,
    db: AsyncSession,
) -> Pickup:
    pickup = await db.get(Pickup, pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found.")
    if pickup.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your pickup.")
    if pickup.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Pickup must be completed before payment.")
    if pickup.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="Pickup is already paid.")

    pickup.payment_status = "PAID"
    pickup.points_earned = 50

    # Award points to household user
    household = await db.get(User, pickup.user_id)
    if household:
        household.points = (household.points or 0) + 50

    # Notify household
    notif = Notification(
        user_id=pickup.user_id,
        type="payment_success",
        title="Cash Payment Recorded",
        message=f"Cash payment of KES {pickup.amount} was recorded. You earned 50 points!",
        link_url="/household/pickup-history",
        pickup_id=pickup.id,
    )
    db.add(notif)
    
    await db.commit()
    await db.refresh(pickup)
    return pickup
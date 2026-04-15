from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.schemas.pickup import (
    CreatePickupRequest,
    UpdatePickupStatusRequest,
    AssignDateRequest,
    PickupOut,
)
from app.services.pickup_service import (
    create_pickup,
    get_user_pickups,
    get_all_pickups,
    update_pickup_status,
    assign_pickup_date,
    process_cash_payment,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/pickups", tags=["pickups"])


@router.post("", response_model=PickupOut, status_code=status.HTTP_201_CREATED)
async def api_create_pickup(
    payload: CreatePickupRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_pickup(payload, user.id, db)


@router.get("/my", response_model=List[PickupOut])
async def api_get_my_pickups(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_user_pickups(user.id, db)


@router.get("", response_model=List[PickupOut])
async def api_get_all_pickups(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_pickups(db)


@router.patch("/{pickup_id}/status", response_model=PickupOut)
async def api_update_pickup_status(
    pickup_id: str,
    payload: UpdatePickupStatusRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_pickup_status(
        pickup_id,
        payload.status,
        user.id,
        db,
        amount=payload.amount,
        weight_kg=payload.weight_kg,
    )


@router.patch("/{pickup_id}/date", response_model=PickupOut)
async def api_assign_pickup_date(
    pickup_id: str,
    payload: AssignDateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Collector assigns or updates the pickup date."""
    return await assign_pickup_date(pickup_id, payload.date, user.id, db)


@router.patch("/{pickup_id}/pay-cash", response_model=PickupOut)
async def api_pay_cash(
    pickup_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Process manual cash payment by household."""
    return await process_cash_payment(pickup_id, user.id, db)
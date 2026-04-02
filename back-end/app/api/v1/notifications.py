from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationOut])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
    )
    return result.scalars().all()

@router.patch("/read-all", response_model=dict)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.read == False)
        .values(read=True)
    )
    await db.commit()
    return {"message": "All marked as read"}

@router.patch("/{notif_id}/read")
async def mark_one_read(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif = await db.get(Notification, notif_id)
    if notif and notif.user_id == current_user.id:
        notif.read = True
        await db.commit()
    return {"message": "ok"}
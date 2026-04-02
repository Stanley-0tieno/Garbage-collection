from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.complaint import Complaint
from app.models.notification import Notification
from app.schemas.complaint import ComplaintOut, CreateComplaintRequest, ResolveComplaintRequest
from app.schemas.auth import MessageResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/complaints", tags=["complaints"])

@router.post("", response_model=ComplaintOut, status_code=201)
async def create_complaint(
    payload: CreateComplaintRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    complaint = Complaint(
        user_id=current_user.id,
        user_role=current_user.role,
        issue_type=payload.issue_type,
        pickup_id=payload.pickup_id,
        message=payload.message,
    )
    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)
    return complaint

@router.get("/my", response_model=list[ComplaintOut])
async def my_complaints(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Complaint)
        .where(Complaint.user_id == current_user.id)
        .order_by(Complaint.created_at.desc())
    )
    return result.scalars().all()

# Admin only
@router.get("", response_model=list[ComplaintOut])
async def all_complaints(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only.")
    result = await db.execute(
        select(Complaint).order_by(Complaint.created_at.desc())
    )
    return result.scalars().all()

@router.patch("/{complaint_id}", response_model=ComplaintOut)
async def resolve_complaint(
    complaint_id: str,
    payload: ResolveComplaintRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only.")
    complaint = await db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    complaint.status = payload.status
    complaint.admin_note = payload.admin_note

    # Notify the user
    if payload.status == "RESOLVED":
        notif = Notification(
            user_id=complaint.user_id,
            type="complaint_resolved",
            title="Your complaint has been resolved",
            message=payload.admin_note or "An admin has resolved your complaint.",
            link_url="/household/complaints" if complaint.user_role == "household" else "/collector/complaints",
            complaint_id=complaint.id
        )
        db.add(notif)

    await db.commit()
    await db.refresh(complaint)
    return complaint
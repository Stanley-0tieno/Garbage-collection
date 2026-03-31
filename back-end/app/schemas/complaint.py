from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

ComplaintStatus = Literal["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]

class CreateComplaintRequest(BaseModel):
    issueType: str
    pickupId: Optional[str] = None
    message: str

class ComplaintOut(BaseModel):
    id: str
    userId: str
    userRole: str
    issueType: str
    pickupId: Optional[str]
    message: str
    status: str
    adminNote: Optional[str]
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_complaint(cls, c) -> "ComplaintOut":
        return cls(
            id=c.id, userId=c.user_id, userRole=c.user_role,
            issueType=c.issue_type, pickupId=c.pickup_id,
            message=c.message, status=c.status,
            adminNote=c.admin_note,
            createdAt=c.created_at, updatedAt=c.updated_at,
        )

class ResolveComplaintRequest(BaseModel):
    status: ComplaintStatus
    adminNote: Optional[str] = None
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationOut(BaseModel):
    id: str
    userId: str
    type: str
    title: str
    message: str
    read: bool
    linkUrl: Optional[str]
    createdAt: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, n) -> "NotificationOut":
        return cls(
            id=n.id, userId=n.user_id, type=n.type,
            title=n.title, message=n.message, read=n.read,
            linkUrl=n.link_url, createdAt=n.created_at,
        )
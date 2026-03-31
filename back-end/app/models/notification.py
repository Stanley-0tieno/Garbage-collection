import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id:  Mapped[str] = mapped_column(String(36))
    type:     Mapped[str] = mapped_column(String(50))
    title:    Mapped[str] = mapped_column(String(255))
    message:  Mapped[str] = mapped_column(Text)
    read:     Mapped[bool] = mapped_column(Boolean, default=False)
    link_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
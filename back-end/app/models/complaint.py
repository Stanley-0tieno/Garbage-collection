import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id:   Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    user_role: Mapped[str] = mapped_column(Enum("household", "collector", name="complaint_role"))
    issue_type: Mapped[str] = mapped_column(String(50))
    pickup_id:  Mapped[str | None] = mapped_column(String(36), nullable=True)
    message:    Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("OPEN", "IN_REVIEW", "RESOLVED", "CLOSED", name="complaint_status"),
        default="OPEN"
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
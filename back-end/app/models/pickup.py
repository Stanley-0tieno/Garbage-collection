import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, Integer, String, Text, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class Pickup(Base):
    __tablename__ = "pickups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    waste_type: Mapped[str] = mapped_column(String(50))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    address: Mapped[str] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    weight_estimate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(Enum("PENDING", "ASSIGNED", "COMPLETED", "CANCELLED", name="pickup_status"), default="PENDING")
    payment_status: Mapped[str] = mapped_column(Enum("UNPAID", "PENDING", "PAID", "FAILED", name="payment_status"), default="UNPAID")
    payment_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    collector_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    points_earned: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

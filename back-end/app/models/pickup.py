import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, Integer, String, Text, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class Pickup(Base):
    __tablename__ = "pickups"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))

    # Waste type stored as comma-separated string for multi-select support
    waste_type: Mapped[str] = mapped_column(Text)

    # Date is optional — assigned by the collector after accepting the job
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Area/zone extracted from address for collector route filtering
    area: Mapped[str | None] = mapped_column(String(255), nullable=True)

    address: Mapped[str] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Actual weight in kg entered by the collector after weighing
    weight_kg: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)

    status: Mapped[str] = mapped_column(
        Enum("PENDING", "ASSIGNED", "COMPLETED", "CANCELLED", name="pickup_status"),
        default="PENDING"
    )
    payment_status: Mapped[str] = mapped_column(
        Enum("UNPAID", "PENDING", "PAID", "FAILED", name="payment_status"),
        default="UNPAID"
    )
    payment_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Collector assigned to this job
    collector_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    collector_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Amount is calculated by system: weight_kg × predefined price/kg
    amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    points_earned: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
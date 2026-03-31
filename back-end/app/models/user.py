import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    first_name: Mapped[str]  = mapped_column(String(100))
    last_name:  Mapped[str]  = mapped_column(String(100))
    email:      Mapped[str]  = mapped_column(String(255), unique=True, index=True)
    phone:      Mapped[str]  = mapped_column(String(30))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(
        Enum("household", "collector", "admin" ,name="user_role"), nullable=False
    )
    points: Mapped[int] = mapped_column(Integer, default=0)

    is_verified:        Mapped[bool]     = mapped_column(Boolean, default=False)
    verification_token: Mapped[str|None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

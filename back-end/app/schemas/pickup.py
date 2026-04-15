from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal, Optional, List
from datetime import datetime
from decimal import Decimal

# ── Predefined system prices per kg (mirrors frontend WASTE_PRICES_PER_KG) ──
WASTE_PRICES_PER_KG: dict[str, float] = {
    "general":    5.0,
    "recyclable": 12.0,
    "organic":    8.0,
    "electronic": 20.0,
    "hazardous":  25.0,
}


class CreatePickupRequest(BaseModel):
    # waste_type is a list from the frontend multi-select; stored as first value
    # (or comma-joined if you want multi-type persistence)
    waste_type: List[str]

    # date intentionally removed — collector assigns it after accepting
    address: str
    area: Optional[str] = None      # auto-extracted on backend if not supplied
    notes: Optional[str] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AssignDateRequest(BaseModel):
    """Collector assigns the pickup date after accepting."""
    date: datetime
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class UpdatePickupStatusRequest(BaseModel):
    status: Literal["ASSIGNED", "COMPLETED", "CANCELLED"]
    # For COMPLETED: collector enters weight → backend calculates amount
    weight_kg: Optional[float] = None
    # amount can still be passed directly (fallback), but weight_kg takes priority
    amount: Optional[float] = None
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class PickupOut(BaseModel):
    id: str
    user_id: str
    waste_type: str
    date: Optional[datetime] = None     # optional — assigned by collector
    area: Optional[str] = None
    address: str
    notes: Optional[str] = None
    image_url: Optional[str] = None
    weight_kg: Optional[float] = None
    status: str
    payment_status: str
    payment_ref: Optional[str] = None
    collector_id: Optional[str] = None
    collector_name: Optional[str] = None
    amount: Optional[float] = None
    points_earned: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )
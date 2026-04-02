from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal, Optional
from datetime import datetime

class CreatePickupRequest(BaseModel):
    waste_type: str
    date: datetime
    address: str
    notes: Optional[str] = None
    image_url: Optional[str] = None
    weight_estimate: Optional[int] = None
    
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

class UpdatePickupStatusRequest(BaseModel):
    status: Literal["ASSIGNED", "COMPLETED", "CANCELLED"]
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

class PickupOut(BaseModel):
    id: str
    user_id: str
    waste_type: str
    date: datetime
    address: str
    notes: Optional[str]
    image_url: Optional[str]
    weight_estimate: Optional[int]
    status: str
    payment_status: str
    payment_ref: Optional[str]
    collector_id: Optional[str]
    amount: Optional[float]
    points_earned: int
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

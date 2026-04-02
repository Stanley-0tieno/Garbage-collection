from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import datetime
from typing import Optional

class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    read: bool
    link_url: Optional[str] = None
    pickup_id: Optional[str] = None
    complaint_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)
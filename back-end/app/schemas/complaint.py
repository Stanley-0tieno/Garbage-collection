from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal, Optional
from datetime import datetime

ComplaintStatus = Literal["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]

class CreateComplaintRequest(BaseModel):
    issue_type: str
    pickup_id: Optional[str] = None
    message: str
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ComplaintOut(BaseModel):
    id: str
    user_id: str
    user_role: str
    issue_type: str
    pickup_id: Optional[str]
    message: str
    status: str
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

class ResolveComplaintRequest(BaseModel):
    status: ComplaintStatus
    admin_note: Optional[str] = None
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
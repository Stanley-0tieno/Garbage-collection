from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal

class STKPushRequest(BaseModel):
    pickup_id: str
    phone: str
    amount: float
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

class STKPushResponse(BaseModel):
    checkout_request_id: str
    message: str
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

class PaymentStatusResponse(BaseModel):
    status: Literal["PAID", "PENDING", "FAILED"]

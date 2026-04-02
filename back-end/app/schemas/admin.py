from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class UserStatsOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    role: str
    total_pickups: int
    completed_pickups: int
    total_spent: float
    total_earned: float
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

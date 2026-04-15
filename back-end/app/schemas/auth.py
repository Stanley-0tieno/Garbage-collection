from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pydantic.alias_generators import to_camel

UserRole = Literal["household", "collector", "admin"]


class SignupRequest(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName:  str = Field(..., min_length=1, max_length=100)
    email:     EmailStr
    phone:     str = Field(..., min_length=5, max_length=30)
    password:  str = Field(..., min_length=6)
    role:      UserRole

    # Household-specific (required when role == "household")
    nationalId: Optional[str] = None

    # Collector-specific (required when role == "collector")
    businessRegNumber:  Optional[str] = None
    vehicleNumberPlate: Optional[str] = None


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel
    )

    id:         str
    first_name:  str
    last_name:   str
    email:      str
    phone:      str
    role:       UserRole
    points:     int
    is_active:  bool

    # Expose role-specific fields in the JWT response so frontend can display them
    national_id:          Optional[str] = None
    business_reg_number:  Optional[str] = None
    vehicle_number_plate: Optional[str] = None


class AuthResponse(BaseModel):
    user:  UserOut
    token: str


class MessageResponse(BaseModel):
    message: str
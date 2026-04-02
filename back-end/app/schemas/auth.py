from typing import Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pydantic.alias_generators import to_camel

UserRole = Literal["household", "collector", "admin"]


class SignupRequest(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName:  str = Field(..., min_length=1, max_length=100)
    email:     EmailStr
    phone:     str = Field(..., min_length=5, max_length=30)
    password:  str = Field(..., min_length=8)
    role:      UserRole

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    id:         str
    first_name:  str
    last_name:   str
    email:      str
    phone:      str
    role:       UserRole
    points:     int
    is_active:  bool


class AuthResponse(BaseModel):
    user:  UserOut
    token: str


class MessageResponse(BaseModel):
    message: str
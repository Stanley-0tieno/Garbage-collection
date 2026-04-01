from typing import Literal
from pydantic import BaseModel, EmailStr, Field


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
    id:         str
    firstName:  str
    lastName:   str
    email:      str
    phone:      str
    role:       UserRole
    points:     int

    model_config = {"from_attributes": True}

    # Map snake_case DB fields → camelCase frontend fields
    @classmethod
    def from_orm_user(cls, user) -> "UserOut":
        return cls(
            id=user.id,
            firstName=user.first_name,
            lastName=user.last_name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            points=user.points,
        )


class AuthResponse(BaseModel):
    user:  UserOut
    token: str


class MessageResponse(BaseModel):
    message: str
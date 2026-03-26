from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginRequest, MessageResponse, SignupRequest
from app.services.auth_service import login_user, register_user, verify_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=201,
    summary="Sign up — sends a confirmation email",
)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    return await register_user(payload, db)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Log in — returns JWT + user object",
)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_user(payload, db)


@router.get(
    "/verify",
    response_model=MessageResponse,
    summary="Confirm email via token link",
)
async def confirm_email(
    token: str = Query(..., description="Token from confirmation email"),
    db: AsyncSession = Depends(get_db),
):
    return await verify_email(token, db)